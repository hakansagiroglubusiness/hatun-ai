import { env } from "cloudflare:workers";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { generations } from "@/db/schema";
import { ApiError, requireApiUser } from "@/lib/hatun-db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const db = getDb();
    const item = await db.query.generations.findFirst({
      where: sql`${generations.id} = ${id} AND ${generations.userId} = ${user.id}`,
    });
    if (!item?.assetKey) throw new ApiError(404, "Dosya bulunamadı.");
    if (!env.ASSETS) throw new ApiError(503, "Dosya depolama bağlı değil.");
    const object = await env.ASSETS.get(item.assetKey);
    if (!object) throw new ApiError(404, "Dosya bulunamadı.");
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("Content-Disposition", `inline; filename="${item.id}.${item.kind === "video" ? "mp4" : "webp"}"`);
    return new Response(object.body, { headers });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : "Dosya alınamadı." },
      { status },
    );
  }
}
