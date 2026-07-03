import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { confirmScanJob } from "@/lib/services/scan";

export const POST = withAuth<{ jobId: string }>(async (req, user, { params }) => {
  const { jobId } = await params;
  const gate = await requireFeature("ai_scanning")();
  if (gate) return gate;

  const body = await req.json().catch(() => ({}));
  const overrides = body?.overrides ?? {};

  const recipe = await confirmScanJob(user.id, jobId, overrides);
  if (!recipe) {
    return Response.json({ error: "Scan not ready" }, { status: 409 });
  }

  return Response.json(recipe, { status: 201 });
});
