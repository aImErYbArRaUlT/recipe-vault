import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { addRecipeToCookbook, listCookbookRecipes } from "@/lib/services/cookbooks";

const schema = z.object({
  recipeId: z.string().min(1),
});

export const GET = withAuth<{ id: string }>(async (_req, user, { params }) => {
  const { id } = await params;
  const recipes = await listCookbookRecipes(user.id, id);
  return Response.json({ cookbookId: id, recipes });
});

export const POST = withAuth<{ id: string }>(async (req, user, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const recipe = await addRecipeToCookbook(user.id, id, parsed.data.recipeId);
  if (!recipe) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(recipe, { status: 201 });
});
