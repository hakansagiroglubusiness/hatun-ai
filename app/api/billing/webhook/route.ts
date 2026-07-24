import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { creditLedger, subscriptions, users } from "@/db/schema";
import { PLAN_CREDITS, stripeClient } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return Response.json({ error: "Webhook yapılandırılmadı." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripeClient().webhooks.constructEventAsync(
      await request.text(),
      signature,
      secret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return Response.json({ error: "Geçersiz webhook imzası." }, { status: 400 });
  }

  const db = getDb();
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId || session.client_reference_id;
    const plan = session.metadata?.plan;
    if (userId && plan === "credits") {
      const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (user) {
        const balance = user.creditBalance + 10000;
        await db.update(users).set({ creditBalance: balance, updatedAt: new Date() }).where(eq(users.id, userId));
        await db.insert(creditLedger).values({
          id: crypto.randomUUID(),
          userId,
          amount: 10000,
          balanceAfter: balance,
          reason: "extra_credit_purchase",
          referenceId: session.id,
          createdAt: new Date(),
        });
      }
    }
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const stripeSubscription = event.data.object;
    const userId = stripeSubscription.metadata.userId;
    const plan = stripeSubscription.metadata.plan || "creator";
    if (userId) {
      const existing = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.providerSubscriptionId, stripeSubscription.id),
      });
      const values = {
        userId,
        provider: "stripe",
        providerCustomerId: String(stripeSubscription.customer),
        providerSubscriptionId: stripeSubscription.id,
        plan,
        status: stripeSubscription.status,
        currentPeriodEnd: new Date(((stripeSubscription.items.data[0]?.current_period_end || 0) * 1000)),
        updatedAt: new Date(),
      };
      if (existing) {
        await db.update(subscriptions).set(values).where(eq(subscriptions.id, existing.id));
      } else {
        await db.insert(subscriptions).values({
          id: crypto.randomUUID(),
          ...values,
          createdAt: new Date(),
        });
      }
      await db.update(users).set({ plan, updatedAt: new Date() }).where(eq(users.id, userId));
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    const parent = invoice.parent?.subscription_details;
    const subscriptionId = parent?.subscription ? String(parent.subscription) : null;
    if (subscriptionId) {
      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.providerSubscriptionId, subscriptionId),
      });
      if (subscription) {
        const amount = PLAN_CREDITS[subscription.plan] || PLAN_CREDITS.creator;
        const user = await db.query.users.findFirst({ where: eq(users.id, subscription.userId) });
        if (user) {
          const balance = user.creditBalance + amount;
          await db.update(users).set({ creditBalance: balance, updatedAt: new Date() }).where(eq(users.id, user.id));
          await db.insert(creditLedger).values({
            id: crypto.randomUUID(),
            userId: user.id,
            amount,
            balanceAfter: balance,
            reason: "subscription_renewal",
            referenceId: invoice.id,
            createdAt: new Date(),
          });
        }
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const stripeSubscription = event.data.object;
    await db.update(subscriptions).set({
      status: "canceled",
      updatedAt: new Date(),
    }).where(eq(subscriptions.providerSubscriptionId, stripeSubscription.id));
  }

  return Response.json({ received: true });
}
