import { headers } from "next/headers";

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

async function getClientIp(): Promise<string> {
  // headers() throws outside a Next request scope (e.g. unit tests); fall back to "unknown".
  try {
    const h = await headers();
    // Use x-real-ip or the LAST x-forwarded-for hop; the first hop is client-controlled.
    const realIp = h.get("x-real-ip")?.trim();
    const lastHop = h
      .get("x-forwarded-for")
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .pop();
    return realIp || lastHop || "unknown";
  } catch {
    return "unknown";
  }
}

// In-memory token-bucket limiter. Process-local: does not survive deploys or coordinate across replicas. Back it with Redis to scale horizontally.
export function rateLimit(opts: { limit: number; windowMs: number }) {
  return async function check(routeKey: string, identifier?: string): Promise<Response | null> {
    cleanup();
    const id = identifier ?? (await getClientIp());
    const key = `${routeKey}:${id}`;
    const now = Date.now();
    const entry = buckets.get(key);

    if (!entry || entry.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
      return null;
    }

    entry.count++;
    if (entry.count > opts.limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return Response.json(
        { error: "Too many requests, slow down a moment." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        },
      );
    }

    return null;
  };
}

// Test-only helper: clear all in-memory buckets between test runs.
export function _resetRateLimitsForTests() {
  buckets.clear();
}
