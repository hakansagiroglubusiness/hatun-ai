import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { generations } from "@/db/schema";
import { ApiError, requireApiUser, storeBytes } from "@/lib/hatun-db";
import { downloadVideo, retrieveVideo } from "@/lib/openai";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const db = getDb();
    let item = await db.query.generations.findFirst({
      where: sql`${generations.id} = ${id} AND ${generations.userId} = ${user.id}`,
    });
    if (!item) throw new ApiError(404, "Üretim bulunamadı.");

    if (item.kind === "video" && item.providerJobId && ["queued", "in_progress", "processing"].includes(item.status)) {
      const video = await retrieveVideo(item.providerJobId);
      const status = String(video.status || item.status);
      const update: Partial<typeof generations.$inferInsert> = { status, updatedAt: new Date() };
      if (status === "failed") update.errorMessage = video.error?.message || "Video üretimi başarısız.";
      if (status === "completed") {
        const bytes = await downloadVideo(item.providerJobId);
        const assetKey = `users/${user.id}/generations/${id}.mp4`;
        await storeBytes(assetKey, bytes, "video/mp4");
        update.assetKey = assetKey;
      }
      await db.update(generations).set(update).where(eq(generations.id, id));
      item = await db.query.generations.findFirst({ where: eq(generations.id, id) }) || item;
    }

    return NextResponse.json({
      generation: {
        id: item.id,
        type: item.kind === "video" ? "Video" : "Görsel",
        title: item.prompt?.slice(0, 54) || "Yeni üretim",
        status: item.status,
        assetUrl: item.assetKey ? `/api/assets/${item.id}` : null,
        error: item.errorMessage,
      },
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Üretim durumu alınamadı." },
      { status },
    );
  }
}
