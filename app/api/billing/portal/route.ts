import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { subscriptions } from "@/db/schema";
import { ApiError, requireApiUser } from "@/lib/hatun-db";
import { stripeClient } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const subscription = await getDb().query.subscriptions.findFirst({
      where: eq(subscriptions.userId, user.id),
    });
    if (!subscription?.providerCustomerId) {
      throw new ApiError(404, "Yönetilecek aktif bir abonelik bulunamadı.");
    }
    const origin = new URL(request.url).origin;
    const session = await stripeClient().billingPortal.sessions.create({
      customer: subscription.providerCustomerId,
      return_url: `${origin}/`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Abonelik yönetimi açılamadı." },
      { status },
    );
  }
}
