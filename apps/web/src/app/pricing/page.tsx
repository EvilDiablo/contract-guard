"use client";

import { useState } from "react";

const plans = [
  {
    id: "starter" as const,
    name: "Starter",
    amount: 19,
    featured: false,
    features: ["Hosted PR bot", "7-day run history", "Email alerts"],
  },
  {
    id: "team" as const,
    name: "Team",
    amount: 49,
    featured: true,
    features: [
      "Everything in Starter",
      "Slack / Teams webhooks",
      "TypeScript + Zod codegen",
      "90-day history",
    ],
  },
  {
    id: "business" as const,
    name: "Business",
    amount: 79,
    featured: false,
    features: [
      "Everything in Team",
      "Priority support",
      "Unlimited history",
      "SSO-ready org seats",
    ],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(plan: "starter" | "team" | "business") {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Checkout failed");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(null);
    }
  }

  return (
    <section>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem" }}>
        Pricing
      </h1>
      <p className="muted">
        Free CLI & GitHub Action forever. Hosted bot and codegen when you need
        team workflows.
      </p>
      {error ? (
        <p style={{ color: "var(--danger)" }} className="mono">
          {error}
        </p>
      ) : null}
      <div className="price-grid">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className={`price${plan.featured ? " featured" : ""}`}
          >
            <h2>{plan.name}</h2>
            <div className="amount">${plan.amount}/mo</div>
            <ul>
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button
              className="btn btn-primary"
              disabled={loading === plan.id}
              onClick={() => void checkout(plan.id)}
            >
              {loading === plan.id ? "Redirecting…" : "Subscribe"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
