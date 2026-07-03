ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trial_reminder_stage" integer DEFAULT 0 NOT NULL;
