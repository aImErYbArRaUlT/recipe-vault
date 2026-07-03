import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { requireDailyAiCredit } from "@/lib/middleware/ai-limits";
import { createScanJob, processScanJob } from "@/lib/services/scan";

const burst = rateLimit({ limit: 10, windowMs: 60_000 });

const schema = z.object({
  imageUrls: z.array(z.string().url()).min(1),
});

export const POST = withAuth(async (req, user) => {
  const gate = await requireFeature("ai_scanning")();
  if (gate) return gate;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const tooMany = await burst("scan", user.id);
  if (tooMany) return tooMany;
  const overCap = await requireDailyAiCredit(user);
  if (overCap) return overCap;

  const job = await createScanJob(user.id, parsed.data.imageUrls);
  const processed = await processScanJob(job.id);

  return Response.json(processed ?? job, { status: 201 });
});
