import { env } from "cloudflare:workers";
import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { creditLedger, generations, uploads, users } from "@/db/schema";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export const TOOL_COSTS = {
  image: 60,
  video: 350,
  motion: 350,
  clone: 5,
  tryon: 75,
  swap: 90,
  upscale: 40,
} as const;

export type ToolId = keyof typeof TOOL_COSTS;

export async function requireApiUser() {
  const identity = await getChatGPTUser();
  if (!identity) throw new ApiError(401, "Devam etmek için giriş yapmalısın.");

  const db = getDb();
  const email = identity.email.toLowerCase();
  let user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    const now = new Date();
    const id = crypto.randomUUID();
    await db.insert(users).values({
      id,
      email,
      displayName: identity.displayName,
      role: email === process.env.HATUN_ADMIN_EMAIL?.toLowerCase() ? "admin" : "user",
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(creditLedger).values({
      id: crypto.randomUUID(),
      userId: id,
      amount: 12000,
      balanceAfter: 12000,
      reason: "welcome_credits",
      createdAt: now,
    });
    user = await db.query.users.findFirst({ where: eq(users.id, id) });
  }
  if (!user) throw new ApiError(500, "Kullanıcı oluşturulamadı.");
  return user;
}

export async function listGenerations(userId: string) {
  const db = getDb();
  return db.query.generations.findMany({
    where: eq(generations.userId, userId),
    orderBy: [desc(generations.createdAt)],
    limit: 60,
  });
}

export async function reserveCredits(userId: string, tool: ToolId, generationId: string) {
  const cost = TOOL_COSTS[tool];
  const db = getDb();
  const result = await db.update(users)
    .set({
      creditBalance: sql`${users.creditBalance} - ${cost}`,
      updatedAt: new Date(),
    })
    .where(sql`${users.id} = ${userId} AND ${users.creditBalance} >= ${cost}`)
    .returning({ balance: users.creditBalance });
  if (!result.length) throw new ApiError(402, "Bu işlem için yeterli kredin yok.");
  await db.insert(creditLedger).values({
    id: crypto.randomUUID(),
    userId,
    amount: -cost,
    balanceAfter: result[0].balance,
    reason: `generation_${tool}`,
    referenceId: generationId,
    createdAt: new Date(),
  });
  return { cost, balance: result[0].balance };
}

export async function refundCredits(userId: string, generationId: string, cost: number) {
  const db = getDb();
  const result = await db.update(users)
    .set({ creditBalance: sql`${users.creditBalance} + ${cost}`, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ balance: users.creditBalance });
  if (result.length) {
    await db.insert(creditLedger).values({
      id: crypto.randomUUID(),
      userId,
      amount: cost,
      balanceAfter: result[0].balance,
      reason: "generation_refund",
      referenceId: generationId,
      createdAt: new Date(),
    });
  }
}

export async function getOwnedUpload(userId: string, uploadId: string) {
  const db = getDb();
  return db.query.uploads.findFirst({
    where: sql`${uploads.id} = ${uploadId} AND ${uploads.userId} = ${userId}`,
  });
}

export async function storeBytes(key: string, bytes: ArrayBuffer | Uint8Array, contentType: string) {
  if (!env.ASSETS) throw new ApiError(503, "Dosya depolama henüz bağlı değil.");
  await env.ASSETS.put(key, bytes, { httpMetadata: { contentType } });
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
