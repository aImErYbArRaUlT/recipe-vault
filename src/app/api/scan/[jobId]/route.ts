import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { getScanJob } from "@/lib/services/scan";

export const GET = withAuth<{ jobId: string }>(async (_req, user, { params }) => {
  const { jobId } = await params;
  const gate = await requireFeature("ai_scanning")();
  if (gate) return gate;

  const job = await getScanJob(user.id, jobId);
  if (!job) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(job);
});
