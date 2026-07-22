import { describe, expect, it, vi } from "vitest";
import { captureEndpoints } from "./capture.js";

describe("captureEndpoints", () => {
  it("fetches JSON and returns structured results", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const results = await captureEndpoints(
      [{ name: "health", method: "GET", url: "/health" }],
      {
        baseUrl: "https://example.com",
        fetchImpl,
      },
    );

    expect(results).toHaveLength(1);
    expect(results[0]!.ok).toBe(true);
    expect(results[0]!.body).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("expands Authorization from API_DIFF_TOKEN-style headers", async () => {
    process.env.TEST_TOKEN = "secret-token";
    const fetchImpl = vi.fn(async (_url, init) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer secret-token");
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    await captureEndpoints(
      [
        {
          name: "secure",
          method: "GET",
          url: "https://example.com/secure",
          headers: { Authorization: "Bearer ${TEST_TOKEN}" },
        },
      ],
      { fetchImpl },
    );
  });
});
