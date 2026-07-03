import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { restoreRecipeVersion } from "@/lib/services/recipe-versions";

export const POST = withAuth<{ id: string; v: string }>(async (_req, user, { params }) => {
  const { id, v } = await params;

  const gate = await requireFeature("version_history")();
  if (gate) return gate;

  const version = Number(v);
  const recipe = await restoreRecipeVersion(user.id, id, version);
  if (!recipe) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(recipe);
});
