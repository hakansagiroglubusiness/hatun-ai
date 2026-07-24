import { NextResponse } from "next/server";
import { ApiError, requireApiUser } from "@/lib/hatun-db";
import { stripeClient, stripePriceFor } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const { plan } = await request.json() as { plan?: string };
    const selected = String(plan || "").toLowerCase();
    if (!["creator", "pro", "advanced", "studio", "credits"].includes(selected)) {
      throw new ApiError(400, "Geçersiz paket.");
    }
    const origin = new URL(request.url).origin;
    const mode = selected === "credits" ? "payment" : "subscription";
    const session = await stripeClient().checkout.sessions.create({
      mode,
      customer_email: user.email,
      client_reference_id: user.id,
      line_items: [{ price: stripePriceFor(selected), quantity: 1 }],
      success_url: `${origin}/?billing=success`,
      cancel_url: `${origin}/?billing=cancelled`,
      allow_promotion_codes: true,
      metadata: { userId: user.id, plan: selected },
      subscription_data: mode === "subscription" ? {
        metadata: { userId: user.id, plan: selected },
      } : undefined,
    });
    if (!session.url) throw new ApiError(502, "Ödeme bağlantısı oluşturulamadı.");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ödeme başlatılamadı." },
      { status },
    );
  }
}
