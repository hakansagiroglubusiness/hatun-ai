import Stripe from "stripe";
import { ApiError } from "./hatun-db";

export const PLAN_CREDITS: Record<string, number> = {
  creator: 12000,
  pro: 30000,
  advanced: 50000,
  studio: 80000,
};

export function stripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new ApiError(503, "Ödeme sistemi henüz etkinleştirilmedi.");
  return new Stripe(secret, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export function stripePriceFor(plan: string) {
  const prices: Record<string, string | undefined> = {
    creator: process.env.STRIPE_PRICE_CREATOR,
    pro: process.env.STRIPE_PRICE_PRO,
    advanced: process.env.STRIPE_PRICE_ADVANCED,
    studio: process.env.STRIPE_PRICE_STUDIO,
    credits: process.env.STRIPE_PRICE_EXTRA_CREDITS,
  };
  const price = prices[plan];
  if (!price) throw new ApiError(503, `${plan} planı için ödeme fiyatı yapılandırılmadı.`);
  return price;
}
