import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { removeFamilyMember } from "@/lib/services/family";

export const DELETE = withAuth<{ userId: string }>(async (_req, user, { params }) => {
  const { userId } = await params;
  const gate = await requireFeature("family_sharing")();
  if (gate) return gate;

  const result = await removeFamilyMember(user.id, userId);
  if (!result) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(result);
});
