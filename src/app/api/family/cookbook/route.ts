import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { getFamilyCookbook } from "@/lib/services/family";

export const GET = withAuth(async (_req, user) => {
  const gate = await requireFeature("family_sharing")();
  if (gate) return gate;

  const cookbook = await getFamilyCookbook(user.id);
  if (!cookbook) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(cookbook);
});
