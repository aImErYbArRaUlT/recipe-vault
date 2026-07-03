// Cron: emails trial milestone reminders, idempotent via users.trialReminderStage.

import "dotenv/config";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { trialReminderEmail } from "@/lib/email/templates";
import { TRIAL_DAYS, MS_PER_DAY } from "@/lib/config/plans";

const DRY_RUN = process.argv.includes("--dry-run");
// One reminder per day of the trial. Values match the email Milestone type.
const MILESTONES = [1, 2, 3] as const;
const MAX_STAGE = MILESTONES[MILESTONES.length - 1];

function daysSinceTrialStart(now: Date, trialEndsAt: Date): number {
  // trialEndsAt is set at signup; trial length comes from config.
  const trialStart = new Date(trialEndsAt.getTime() - TRIAL_DAYS * MS_PER_DAY);
  const ms = now.getTime() - trialStart.getTime();
  return Math.floor(ms / MS_PER_DAY);
}

async function main() {
  const now = new Date();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!process.env.RESEND_API_KEY) {
    console.log("[trial-reminders] RESEND_API_KEY not set; nothing to do.");
    return;
  }

  // Candidates: anyone still on the trial plan with a known trial end date.
  const candidates = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      trialEndsAt: users.trialEndsAt,
      stage: users.trialReminderStage,
    })
    .from(users)
    .where(
      and(
        eq(users.planId, "trial"),
        sql`${users.trialEndsAt} IS NOT NULL`,
        lt(users.trialReminderStage, MAX_STAGE),
        // Include trials that ended up to a day ago so they get the final reminder.
        gt(users.trialEndsAt, sql`now() - interval '1 day'`),
      ),
    );

  if (candidates.length === 0) {
    console.log(`[trial-reminders] No reminders to send at ${now.toISOString()}.`);
    return;
  }

  let sentCount = 0;
  let skipCount = 0;

  for (const user of candidates) {
    if (!user.trialEndsAt) continue;
    const daysIn = daysSinceTrialStart(now, user.trialEndsAt);
    // Highest milestone reached today.
    const nextMilestone = MILESTONES.find(
      (m) => daysIn >= m && user.stage < m,
    );
    if (!nextMilestone) {
      skipCount++;
      continue;
    }

    const daysRemaining = Math.max(
      0,
      Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / MS_PER_DAY),
    );

    const message = trialReminderEmail({
      milestone: nextMilestone,
      daysRemaining,
      displayName: user.displayName,
      trialEndsAt: user.trialEndsAt,
      ctaUrl: `${baseUrl}/settings/billing`,
    });

    if (DRY_RUN) {
      console.log(
        `  · [DRY] ${user.email}  milestone=${nextMilestone}  daysIn=${daysIn}  subject="${message.subject}"`,
      );
    } else {
      try {
        await sendEmail({
          to: user.email,
          subject: message.subject,
          html: message.html,
        });
        await db
          .update(users)
          .set({ trialReminderStage: nextMilestone, updatedAt: now })
          .where(eq(users.id, user.id));
        console.log(
          `  · ${user.email}  milestone=${nextMilestone}  daysIn=${daysIn}`,
        );
        sentCount++;
      } catch (err) {
        console.error(
          `  ! Failed to email ${user.email} milestone ${nextMilestone}:`,
          err,
        );
      }
    }
  }

  console.log(
    `[trial-reminders] ${DRY_RUN ? "Dry run: would send" : "Sent"} ${sentCount} reminders. Skipped ${skipCount}.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[trial-reminders] FAILED:", error);
    process.exit(1);
  });
