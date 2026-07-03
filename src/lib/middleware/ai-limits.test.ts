/* @vitest-environment node */
import type { User } from "@/lib/db/schema";

/**
 * Tests for the per-user daily AI cap.
 *
 * The cap is enforced via an atomic UPDATE … WHERE clause that increments
 * (or resets) the user's count only if they would not exceed their plan limit.
 * Drizzle's `db.update(...).set(...).where(...).returning(...)` chain is
 * mocked here so we can assert behavior without hitting Postgres.
 */

const returningMock = vi.fn();
const whereMock = vi.fn(() => ({ returning: returningMock }));
const setMock = vi.fn(() => ({ where: whereMock }));
const updateMock = vi.fn(() => ({ set: setMock }));

vi.mock("@/lib/db", () => ({
  db: {
    update: updateMock,
    select: vi.fn(),
  },
}));

let consumeDailyAiCredit: typeof import("@/lib/middleware/ai-limits").consumeDailyAiCredit;
let requireDailyAiCredit: typeof import("@/lib/middleware/ai-limits").requireDailyAiCredit;
let DAILY_AI_LIMITS: typeof import("@/lib/middleware/ai-limits").DAILY_AI_LIMITS;

beforeAll(async () => {
  const mod = await import("@/lib/middleware/ai-limits");
  consumeDailyAiCredit = mod.consumeDailyAiCredit;
  requireDailyAiCredit = mod.requireDailyAiCredit;
  DAILY_AI_LIMITS = mod.DAILY_AI_LIMITS;
});

beforeEach(() => {
  updateMock.mockClear();
  setMock.mockClear();
  whereMock.mockClear();
  returningMock.mockReset();
});

const baseUser = { id: "user-1", planId: "pro" } as User;

describe("DAILY_AI_LIMITS", () => {
  it("free plan gets zero quota", () => {
    expect(DAILY_AI_LIMITS.free).toBe(0);
  });

  it("paid plans have positive quotas", () => {
    expect(DAILY_AI_LIMITS.trial).toBeGreaterThan(0);
    expect(DAILY_AI_LIMITS.pro).toBeGreaterThan(0);
    expect(DAILY_AI_LIMITS.family).toBeGreaterThan(DAILY_AI_LIMITS.pro);
  });
});

describe("consumeDailyAiCredit", () => {
  it("rejects free plan without touching DB", async () => {
    const free = { ...baseUser, planId: "free" } as User;
    const result = await consumeDailyAiCredit(free);
    expect(result).toEqual({ ok: false, limit: 0 });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects null planId same as free", async () => {
    const noPlan = { ...baseUser, planId: null } as User;
    const result = await consumeDailyAiCredit(noPlan);
    expect(result.ok).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("allows pro user under cap and returns remaining", async () => {
    returningMock.mockResolvedValueOnce([{ count: 5 }]);
    const result = await consumeDailyAiCredit(baseUser);
    expect(result).toEqual({
      ok: true,
      remaining: DAILY_AI_LIMITS.pro - 5,
      limit: DAILY_AI_LIMITS.pro,
    });
    expect(updateMock).toHaveBeenCalledOnce();
  });

  it("denies when DB update returns no row (over cap)", async () => {
    returningMock.mockResolvedValueOnce([]);
    const result = await consumeDailyAiCredit(baseUser);
    expect(result).toEqual({ ok: false, limit: DAILY_AI_LIMITS.pro });
  });

  it("uses correct limit per plan", async () => {
    returningMock.mockResolvedValueOnce([{ count: 1 }]);
    const family = { ...baseUser, planId: "family" } as User;
    const result = await consumeDailyAiCredit(family);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.limit).toBe(DAILY_AI_LIMITS.family);
    }
  });
});

describe("requireDailyAiCredit", () => {
  it("returns null when under cap", async () => {
    returningMock.mockResolvedValueOnce([{ count: 1 }]);
    const result = await requireDailyAiCredit(baseUser);
    expect(result).toBeNull();
  });

  it("returns 429 response with Retry-After when over cap", async () => {
    returningMock.mockResolvedValueOnce([]);
    const result = await requireDailyAiCredit(baseUser);
    expect(result).toBeInstanceOf(Response);
    expect(result?.status).toBe(429);
    expect(result?.headers.get("Retry-After")).toMatch(/^\d+$/);
  });

  it("returns 429 immediately for free plan (no DB hit)", async () => {
    const free = { ...baseUser, planId: "free" } as User;
    const result = await requireDailyAiCredit(free);
    expect(result?.status).toBe(429);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("429 body includes limit and upgrade_url", async () => {
    returningMock.mockResolvedValueOnce([]);
    const result = await requireDailyAiCredit(baseUser);
    expect(result).toBeInstanceOf(Response);
    const body = await result!.json();
    expect(body.limit).toBe(DAILY_AI_LIMITS.pro);
    expect(body.upgrade_url).toBe("/settings/billing");
    expect(body.error).toContain("Daily AI limit");
  });
});
