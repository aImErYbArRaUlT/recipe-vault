/* @vitest-environment node */
import { rateLimit, _resetRateLimitsForTests } from "@/lib/middleware/rate-limit";

beforeEach(() => {
  _resetRateLimitsForTests();
});

describe("rateLimit", () => {
  it("allows requests under the limit", async () => {
    const limit = rateLimit({ limit: 3, windowMs: 60_000 });
    expect(await limit("route", "user-1")).toBeNull();
    expect(await limit("route", "user-1")).toBeNull();
    expect(await limit("route", "user-1")).toBeNull();
  });

  it("returns 429 once limit is exceeded", async () => {
    const limit = rateLimit({ limit: 2, windowMs: 60_000 });
    await limit("route", "user-1");
    await limit("route", "user-1");
    const blocked = await limit("route", "user-1");
    expect(blocked).toBeInstanceOf(Response);
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get("Retry-After")).toMatch(/^\d+$/);
  });

  it("uses separate buckets per identifier", async () => {
    const limit = rateLimit({ limit: 1, windowMs: 60_000 });
    expect(await limit("route", "user-A")).toBeNull();
    // user-A would be rate-limited on a second call, but user-B is fresh:
    expect(await limit("route", "user-B")).toBeNull();
  });

  it("uses separate buckets per route key", async () => {
    const limit = rateLimit({ limit: 1, windowMs: 60_000 });
    expect(await limit("route-A", "user-1")).toBeNull();
    expect(await limit("route-B", "user-1")).toBeNull();
  });

  it("falls back to IP-derived key when no identifier given", async () => {
    // Outside Next request scope, headers() throws. The limiter swallows
    // and uses "unknown" as the bucket key. Two anonymous calls share it.
    const limit = rateLimit({ limit: 1, windowMs: 60_000 });
    expect(await limit("anon")).toBeNull();
    const blocked = await limit("anon");
    expect(blocked?.status).toBe(429);
  });

  it("resets bucket after window expires", async () => {
    const limit = rateLimit({ limit: 1, windowMs: 10 });
    expect(await limit("route", "user-1")).toBeNull();
    expect((await limit("route", "user-1"))?.status).toBe(429);
    await new Promise((r) => setTimeout(r, 15));
    expect(await limit("route", "user-1")).toBeNull();
  });
});
