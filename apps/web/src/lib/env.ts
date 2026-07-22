export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export function getStripePriceId(plan: "starter" | "team" | "business"): string {
  const map = {
    starter: process.env.STRIPE_PRICE_STARTER,
    team: process.env.STRIPE_PRICE_TEAM,
    business: process.env.STRIPE_PRICE_BUSINESS,
  } as const;
  const id = map[plan];
  if (!id) {
    throw new Error(`Missing Stripe price for plan: ${plan}`);
  }
  return id;
}
