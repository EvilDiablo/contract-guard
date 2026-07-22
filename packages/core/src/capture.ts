import type { CaptureEndpoint, JsonValue } from "./types.js";

export interface CaptureResult {
  name: string;
  url: string;
  method: string;
  status: number;
  body: JsonValue;
  ok: boolean;
  error?: string;
}

export interface CaptureOptions {
  baseUrl?: string;
  /** Extra headers applied to every request (e.g. Authorization). */
  defaultHeaders?: Record<string, string>;
  /** Fetch implementation (injectable for tests). */
  fetchImpl?: typeof fetch;
  /** Timeout in ms (default 30000). */
  timeoutMs?: number;
}

function resolveUrl(url: string, baseUrl?: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (!baseUrl) return url;
  return new URL(url, baseUrl.replace(/\/?$/, "/")).toString();
}

function expandEnv(value: string): string {
  return value.replace(/\$\{([A-Z0-9_]+)\}/gi, (_, name: string) => {
    return process.env[name] ?? "";
  });
}

function expandHeaders(headers?: Record<string, string>): Record<string, string> {
  if (!headers) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = expandEnv(v);
  }
  return out;
}

/** Hit configured endpoints and return JSON bodies (structural snapshots). */
export async function captureEndpoints(
  endpoints: CaptureEndpoint[],
  options: CaptureOptions = {},
): Promise<CaptureResult[]> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const results: CaptureResult[] = [];

  for (const ep of endpoints) {
    const url = resolveUrl(ep.url, options.baseUrl);
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...expandHeaders(options.defaultHeaders),
      ...expandHeaders(ep.headers),
    };
    const init: RequestInit = {
      method: ep.method,
      headers,
    };
    if (ep.body !== undefined && ep.method !== "GET") {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      init.body = JSON.stringify(ep.body);
      init.headers = headers;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    init.signal = controller.signal;

    try {
      const res = await fetchImpl(url, init);
      const text = await res.text();
      let body: JsonValue = null;
      try {
        body = text ? (JSON.parse(text) as JsonValue) : null;
      } catch {
        body = { _nonJson: true, preview: text.slice(0, 200) };
      }
      results.push({
        name: ep.name,
        url,
        method: ep.method,
        status: res.status,
        body,
        ok: res.ok,
      });
    } catch (err) {
      results.push({
        name: ep.name,
        url,
        method: ep.method,
        status: 0,
        body: null,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      clearTimeout(timer);
    }
  }

  return results;
}
