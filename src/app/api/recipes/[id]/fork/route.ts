import { withAuth } from "@/lib/middleware/with-auth";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const POST = withAuth<{ id: string }>(async (_req, user, { params }) => {
  const { id } = await params;

  const recipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, id),
  });

  if (!recipe || recipe.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const [forked] = await db
    .insert(recipes)
    .values({
      userId: user.id,
      title: `${recipe.title} (Fork)`,
      description: recipe.description,
      sourceType: "fork",
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      servings: recipe.servings,
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      totalTimeMinutes: recipe.totalTimeMinutes,
      cuisine: recipe.cuisine,
      tags: recipe.tags,
      difficulty: recipe.difficulty,
      nutrition: recipe.nutrition,
      forkedFromId: recipe.id,
      forkedFromUser: user.displayName ?? null,
    })
    .returning();

  return Response.json(forked, { status: 201 });
});
