import { NextResponse } from "next/server";
import { getStripe, type PaidPlan } from "@/lib/stripe";
import { getStripePriceId } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      plan?: PaidPlan;
      orgSlug?: string;
      email?: string;
    };
    const plan = body.plan ?? "starter";
    if (!["starter", "team", "business"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const stripe = getStripe();
    const priceId = getStripePriceId(plan);
    const origin = request.headers.get("origin") ?? process.env.APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: body.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success&plan=${plan}`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      metadata: {
        plan,
        orgSlug: body.orgSlug ?? "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
