import { withAuth } from "@/lib/middleware/with-auth";
import { removeRecipeFromCookbook } from "@/lib/services/cookbooks";

export const DELETE = withAuth<{ id: string; recipeId: string }>(async (_req, user, { params }) => {
  const { id, recipeId } = await params;
  const recipe = await removeRecipeFromCookbook(user.id, id, recipeId);
  if (!recipe) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ status: "removed" });
});
