import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { getUserRecipes } from "@/lib/middleware/data-access";
import { createRecipeVersion } from "@/lib/services/recipe-versions";
import { toRecipeSnapshot, toRecipeWriteFields } from "@/lib/services/recipe-snapshot";

export async function listRecipes(userId: string) {
  return getUserRecipes(userId);
}

export async function createRecipe(userId: string, input: {
  title: string;
  description?: string | null;
  ingredients?: unknown[];
  steps?: unknown[];
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  totalTimeMinutes?: number | null;
  servings?: number | null;
  cuisine?: string | null;
  tags?: string[] | null;
  difficulty?: string | null;
  nutrition?: Record<string, unknown> | null;
}) {
  const snapshot = toRecipeSnapshot(input, { servingsFallback: 4 });
  const [recipe] = await db
    .insert(recipes)
    .values({
      userId,
      ...toRecipeWriteFields(snapshot),
    })
    .returning();

  return recipe;
}

export async function getRecipe(userId: string, recipeId: string) {
  return db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.userId, userId)),
  });
}

export async function updateRecipe(
  userId: string,
  recipeId: string,
  input: Partial<{
    title: string;
    description: string | null;
    ingredients: unknown[];
    steps: unknown[];
    prepTimeMinutes: number | null;
    cookTimeMinutes: number | null;
    totalTimeMinutes: number | null;
    servings: number | null;
    cuisine: string | null;
    tags: string[] | null;
    difficulty: string | null;
    nutrition: Record<string, unknown> | null;
    changesSummary?: string;
  }>
) {
  const existing = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.userId, userId)),
  });

  if (!existing) return null;

  await createRecipeVersion({
    recipeId,
    version: existing.version ?? 1,
    changedById: userId,
    changedByName: existing.forkedFromUser ?? "User",
    snapshot: toRecipeSnapshot(existing),
    changesSummary: input.changesSummary ?? "Recipe updated",
  });

  const [recipe] = await db
    .update(recipes)
    .set({
      title: input.title ?? existing.title,
      description: "description" in input ? input.description : existing.description,
      ingredients: input.ingredients ?? existing.ingredients,
      steps: input.steps ?? existing.steps,
      prepTimeMinutes: "prepTimeMinutes" in input ? input.prepTimeMinutes : existing.prepTimeMinutes,
      cookTimeMinutes: "cookTimeMinutes" in input ? input.cookTimeMinutes : existing.cookTimeMinutes,
      totalTimeMinutes: "totalTimeMinutes" in input ? input.totalTimeMinutes : existing.totalTimeMinutes,
      servings: "servings" in input ? input.servings : existing.servings,
      cuisine: "cuisine" in input ? input.cuisine : existing.cuisine,
      tags: "tags" in input ? input.tags : existing.tags,
      difficulty: "difficulty" in input ? input.difficulty : existing.difficulty,
      nutrition: "nutrition" in input ? input.nutrition : existing.nutrition,
      updatedAt: new Date(),
      version: (existing.version ?? 1) + 1,
    })
    .where(eq(recipes.id, recipeId))
    .returning();

  return recipe;
}

export async function softDeleteRecipe(userId: string, recipeId: string) {
  const [recipe] = await db
    .update(recipes)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
    .returning();

  return recipe;
}
