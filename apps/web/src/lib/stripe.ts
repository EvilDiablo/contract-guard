import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  stripe = new Stripe(key);
  return stripe;
}

export const PLAN_AMOUNTS = {
  starter: 19,
  team: 49,
  business: 79,
} as const;

export type PaidPlan = keyof typeof PLAN_AMOUNTS;
