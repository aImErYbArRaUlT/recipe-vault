import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { User } from "@/lib/db/schema";
import { DAILY_AI_LIMITS } from "@/lib/config/plans";

// Re-export so existing server-side callers and tests continue working.
export { DAILY_AI_LIMITS } from "@/lib/config/plans";

// Per-user daily AI quota across all endpoints. Increments on entry (not success) so retried failures can't bypass the cap, and resets lazily on the first call of a new UTC day.

export type DailyCapResult =
  | { ok: true; remaining: number; limit: number }
  | { ok: false; limit: number };

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Atomically increment the daily AI count if under limit; single UPDATE...WHERE so concurrent calls can't race past the cap.
export async function consumeDailyAiCredit(user: User): Promise<DailyCapResult> {
  const limit =
    DAILY_AI_LIMITS[(user.planId ?? "free") as keyof typeof DAILY_AI_LIMITS] ??
    0;
  if (limit === 0) {
    // No quota at all; defensive in case feature-gate didn't already reject.
    return { ok: false, limit };
  }

  const today = todayUTC();

  // Single statement increment-or-reset, only if under limit; returns new count when applied, empty otherwise.
  const updated = await db
    .update(users)
    .set({
      aiCallsCount: sql`CASE
        WHEN ${users.aiCallsDate} IS NULL OR ${users.aiCallsDate} <> ${today}::date
          THEN 1
        ELSE ${users.aiCallsCount} + 1
      END`,
      aiCallsDate: sql`${today}::date`,
      updatedAt: new Date(),
    })
    .where(
      sql`${users.id} = ${user.id} AND (
        ${users.aiCallsDate} IS NULL
        OR ${users.aiCallsDate} <> ${today}::date
        OR ${users.aiCallsCount} < ${limit}
      )`,
    )
    .returning({ count: users.aiCallsCount });

  if (updated.length === 0) {
    return { ok: false, limit };
  }

  const newCount = updated[0].count;
  return { ok: true, remaining: Math.max(0, limit - newCount), limit };
}

// Express-style guard returning a 429 Response when over limit; call after requireAuth + requireFeature.
export async function requireDailyAiCredit(user: User): Promise<Response | null> {
  const result = await consumeDailyAiCredit(user);
  if (result.ok) {
    return null;
  }
  return Response.json(
    {
      error: "Daily AI limit reached",
      detail: `You've used your ${result.limit} AI requests for today. Resets at UTC midnight.`,
      limit: result.limit,
      upgrade_url: "/settings/billing",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(secondsUntilUtcMidnight()),
      },
    },
  );
}

function secondsUntilUtcMidnight(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
  ));
  return Math.max(60, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

/** Look up current usage without incrementing - for UI display. */
export async function getDailyAiUsage(userId: string): Promise<{ count: number; limit: number; date: string }> {
  const row = await db
    .select({
      planId: users.planId,
      count: users.aiCallsCount,
      date: users.aiCallsDate,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const today = todayUTC();
  if (row.length === 0) {
    return { count: 0, limit: 0, date: today };
  }
  const u = row[0];
  const limit =
    DAILY_AI_LIMITS[(u.planId ?? "free") as keyof typeof DAILY_AI_LIMITS] ?? 0;
  const isToday = u.date === today;
  return { count: isToday ? u.count : 0, limit, date: today };
}
