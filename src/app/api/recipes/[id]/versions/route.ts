import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { listRecipeVersions } from "@/lib/services/recipe-versions";

export const GET = withAuth<{ id: string }>(async (_req, user, { params }) => {
  const { id } = await params;

  const gate = await requireFeature("version_history")();
  if (gate) return gate;

  const versions = await listRecipeVersions(user.id, id);
  return Response.json({ recipeId: id, versions });
});
