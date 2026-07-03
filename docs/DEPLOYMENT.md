# Recipe Vault Deployment

> Product name is "Recipe Vault". Railway service names (`simmer-app`, `simmer-db`, `simmer-redis`) and the R2 bucket (`simmer-uploads`) keep the legacy `simmer-` prefix because they reference real deployed resources. Do not rename without an infra migration plan.

## Railway services
- App service (Next.js) on port 3000
- Postgres 16 service
- Redis (optional)

## Required environment variables
- DATABASE_URL (Railway Postgres)
- NEXTAUTH_URL (https://your-domain)
- NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
- APPLE_CLIENT_ID / APPLE_CLIENT_SECRET
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- R2_ENDPOINT
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET_NAME
- R2_PUBLIC_URL
- GEMINI_API_KEY
- GEMINI_MODEL (default gemini-2.5-flash)

## Stripe
- Create products and prices for Home, Pro, Family
- Add webhook endpoint: `/api/stripe/webhooks`
- Enable events: checkout.session.completed, invoice.paid, invoice.payment_failed,
  customer.subscription.updated, customer.subscription.deleted

## R2
- Create bucket `simmer-uploads`
- Enable public access and set `R2_PUBLIC_URL`

## Health check
- Set Railway health check to `/api/health`

## Migrations
Run migrations once after provisioning DB:
```bash
npm run db:generate
npm run db:migrate
```

## Cost controls (AI rate limits)

Every AI endpoint enforces two layers of protection:

1. **Per-user, per-minute burst limit** (in-memory; resets on deploy).
2. **Per-user daily cap** across all AI endpoints combined (DB-backed in `users.ai_calls_count` / `users.ai_calls_date`, atomic UPDATE, lazy reset at UTC midnight).

| Endpoint | Burst (per user/min) | Counts toward daily cap |
|---|---|---|
| `/api/scan` | 10 | yes |
| `/api/recipes/parse` | 10 | yes |
| `/api/cookguide/start` | 5 | no (session creation) |
| `/api/cookguide/message` | 20 | yes |
| `/api/modify` | 15 | yes |
| `/api/modify/substitute` | 15 | yes |
| `/api/modify/nutrition` | 5 | yes |
| `/api/modify/scale` | 60 | no (pure math) |
| `/api/tts` | 30 | no (separate OpenAI billing) |
| `/api/stt` | 30 | no (separate OpenAI billing) |

Daily caps by plan (see `src/lib/middleware/ai-limits.ts`):

| Plan | Daily AI calls |
|---|---|
| free / home | 0 (also blocked at feature-gate) |
| trial | 250 |
| pro | 1,000 |
| family | 1,500 (per member) |

When a user hits a cap they get a 429 with `Retry-After` set to seconds-until-UTC-midnight and an `upgrade_url` in the body.

> Single-replica caveat: the per-minute burst counter is in-process. Acceptable at 1 replica; swap `buckets` in `src/lib/middleware/rate-limit.ts` for Redis (already provisioned as `simmer-redis`) before scaling horizontally. The daily cap is DB-backed and works at any scale.

## Scheduled jobs

### Trial expiry (`cron:expire-trials`)
Flips users from `subscriptionStatus = "trialing"` → `"expired"` once `trialEndsAt` is in the past. The proxy middleware also enforces this at request time, so the cron is for keeping DB state accurate - it's not load-bearing for access control.

**Local / manual run:**
```bash
npm run cron:expire-trials              # apply
npm run cron:expire-trials -- --dry-run # preview, no DB writes
```

**Railway setup:**
1. In the `simmer-production` project, add a new service: **+ New → Cron**.
2. Source: same GitHub repo as `simmer-app`.
3. Schedule: `0 6 * * *` (06:00 UTC daily).
4. Start command: `npm run cron:expire-trials`.
5. Variables: link `DATABASE_URL` from the Postgres service (same as `simmer-app`).

**Verifying:**
After deploy, check the cron service's logs - a successful run prints `[expire-trials] No trials to expire` or `[expire-trials] Expired N trials in Xms`.

### Trial reminder emails (`cron:trial-reminders`)
Sends day-3 / day-5 / day-7 emails to users still on the trial plan. Idempotent via `users.trial_reminder_stage` - each user gets at most one email per milestone.

**Local / manual run:**
```bash
npm run cron:trial-reminders              # apply
npm run cron:trial-reminders -- --dry-run # preview, no emails sent
```

**Railway setup:**
1. Add a second cron service (or reuse the trial-expiry one with a different schedule).
2. Schedule: `15 * * * *` (15 past every hour). Hourly is safe because the milestone gate prevents duplicates.
3. Start command: `npm run cron:trial-reminders`.
4. Same variables as the app service (`DATABASE_URL`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`).
