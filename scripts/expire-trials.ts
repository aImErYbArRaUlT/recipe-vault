// Daily cron: downgrade users whose trial has ended to the free plan.

import "dotenv/config";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const now = new Date();
  const startedAt = Date.now();

  const candidates = await db
    .select({
      id: users.id,
      email: users.email,
      planId: users.planId,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .where(
      and(
        eq(users.planId, "trial"),
        lt(users.trialEndsAt, now),
      ),
    );

  if (candidates.length === 0) {
    console.log(`[expire-trials] No trials to roll over (checked at ${now.toISOString()}).`);
    return;
  }

  console.log(
    `[expire-trials] ${candidates.length} trial${candidates.length === 1 ? "" : "s"} to roll over to Free:`,
  );
  for (const u of candidates) {
    console.log(
      `  · ${u.email}  (trialEndsAt=${u.trialEndsAt?.toISOString() ?? "null"})`,
    );
  }

  if (DRY_RUN) {
    console.log(`[expire-trials] Dry run, no changes written.`);
    return;
  }

  const result = await db
    .update(users)
    .set({
      planId: "free",
      subscriptionStatus: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(users.planId, "trial"),
        lt(users.trialEndsAt, now),
      ),
    )
    .returning({ id: users.id });

  const ms = Date.now() - startedAt;
  console.log(
    `[expire-trials] Rolled ${result.length} trial${result.length === 1 ? "" : "s"} to Free in ${ms}ms.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[expire-trials] FAILED:", error);
    process.exit(1);
  });
