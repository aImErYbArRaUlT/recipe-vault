import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipeVersions, recipes } from "@/lib/db/schema";

export async function createRecipeVersion(input: {
  recipeId: string;
  version: number;
  changedById: string;
  changedByName: string;
  snapshot: Record<string, unknown>;
  changesSummary: string;
}) {
  const [entry] = await db
    .insert(recipeVersions)
    .values({
      recipeId: input.recipeId,
      version: input.version,
      changedById: input.changedById,
      changedByName: input.changedByName,
      snapshot: input.snapshot,
      changesSummary: input.changesSummary,
    })
    .returning();

  return entry;
}

export async function listRecipeVersions(userId: string, recipeId: string) {
  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.userId, userId)),
  });
  if (!recipe) return [];

  return db.query.recipeVersions.findMany({
    where: eq(recipeVersions.recipeId, recipeId),
    orderBy: desc(recipeVersions.version),
  });
}

export async function restoreRecipeVersion(
  userId: string,
  recipeId: string,
  version: number
) {
  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.userId, userId)),
  });

  if (!recipe) return null;

  const entry = await db.query.recipeVersions.findFirst({
    where: and(
      eq(recipeVersions.recipeId, recipeId),
      eq(recipeVersions.version, version)
    ),
  });

  if (!entry) return null;

  const snapshot = entry.snapshot as Record<string, unknown>;
  const [updated] = await db
    .update(recipes)
    .set({
      title: String(snapshot.title ?? recipe.title),
      description: (snapshot.description as string) ?? recipe.description,
      ingredients: (snapshot.ingredients as object[]) ?? recipe.ingredients,
      steps: (snapshot.steps as object[]) ?? recipe.steps,
      prepTimeMinutes: (snapshot.prep_time_minutes as number) ?? recipe.prepTimeMinutes,
      cookTimeMinutes: (snapshot.cook_time_minutes as number) ?? recipe.cookTimeMinutes,
      totalTimeMinutes: (snapshot.total_time_minutes as number) ?? recipe.totalTimeMinutes,
      servings: (snapshot.servings as number) ?? recipe.servings,
      cuisine: (snapshot.cuisine as string) ?? recipe.cuisine,
      tags: (snapshot.tags as string[]) ?? recipe.tags,
      difficulty: (snapshot.difficulty as string) ?? recipe.difficulty,
      nutrition: (snapshot.nutrition as object) ?? recipe.nutrition,
      version: (recipe.version ?? 1) + 1,
      updatedAt: new Date(),
    })
    .where(eq(recipes.id, recipeId))
    .returning();

  await createRecipeVersion({
    recipeId,
    version: (recipe.version ?? 1) + 1,
    changedById: userId,
    changedByName: recipe.forkedFromUser ?? "User",
    snapshot,
    changesSummary: `Restored to version ${version}`,
  });

  return updated ?? null;
}
