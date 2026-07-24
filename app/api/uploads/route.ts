import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { uploads } from "@/db/schema";
import { ApiError, requireApiUser } from "@/lib/hatun-db";

// Sites currently rejects larger request bodies before they reach this route.
const MAX_BYTES = 900 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp",
  "video/mp4", "video/webm", "application/pdf",
]);

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    if (!env.MEDIA) throw new ApiError(503, "Dosya depolama henüz bağlı değil.");
    const form = await request.formData();
    const files = form.getAll("files").filter((value): value is File => value instanceof File);
    const purpose = String(form.get("purpose") || "reference");
    const consentConfirmed = String(form.get("consentConfirmed") || "") === "true";
    if (!files.length) throw new ApiError(400, "En az bir dosya seç.");
    if (files.length > 8) throw new ApiError(400, "Tek seferde en fazla 8 dosya yükleyebilirsin.");

    const db = getDb();
    const output = [];
    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) throw new ApiError(400, `${file.name} desteklenmeyen bir dosya türü.`);
      if (file.size > MAX_BYTES) throw new ApiError(413, `${file.name} 900 KB sınırını aşıyor.`);
      const id = crypto.randomUUID();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const objectKey = `users/${user.id}/uploads/${id}-${safeName}`;
      await env.MEDIA.put(objectKey, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      });
      await db.insert(uploads).values({
        id,
        userId: user.id,
        objectKey,
        filename: file.name,
        contentType: file.type,
        byteSize: file.size,
        purpose,
        consentConfirmed,
        createdAt: new Date(),
      });
      output.push({ id, filename: file.name, contentType: file.type, byteSize: file.size });
    }
    return NextResponse.json({ uploads: output }, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Dosyalar yüklenemedi." },
      { status },
    );
  }
}
