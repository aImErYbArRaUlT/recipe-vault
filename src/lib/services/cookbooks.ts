import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cookbooks, recipes } from "@/lib/db/schema";

export async function listCookbooks(userId: string) {
  return db.query.cookbooks.findMany({
    where: eq(cookbooks.userId, userId),
  });
}

export async function getCookbook(userId: string, cookbookId: string) {
  return db.query.cookbooks.findFirst({
    where: and(eq(cookbooks.id, cookbookId), eq(cookbooks.userId, userId)),
  });
}

export async function createCookbook(userId: string, title: string) {
  const [cookbook] = await db
    .insert(cookbooks)
    .values({
      userId,
      title,
    })
    .returning();

  return cookbook;
}

export async function updateCookbook(
  userId: string,
  cookbookId: string,
  input: Partial<{ title: string; description: string | null }>
) {
  const [cookbook] = await db
    .update(cookbooks)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(cookbooks.id, cookbookId), eq(cookbooks.userId, userId)))
    .returning();

  return cookbook;
}

export async function deleteCookbook(userId: string, cookbookId: string) {
  const [cookbook] = await db
    .delete(cookbooks)
    .where(and(eq(cookbooks.id, cookbookId), eq(cookbooks.userId, userId)))
    .returning();

  return cookbook;
}

export async function listCookbookRecipes(userId: string, cookbookId: string) {
  return db.query.recipes.findMany({
    where: and(eq(recipes.userId, userId), eq(recipes.cookbookId, cookbookId)),
  });
}

export async function addRecipeToCookbook(
  userId: string,
  cookbookId: string,
  recipeId: string
) {
  // Verify the target cookbook belongs to the user before reassigning.
  const cookbook = await db.query.cookbooks.findFirst({
    where: and(eq(cookbooks.id, cookbookId), eq(cookbooks.userId, userId)),
  });
  if (!cookbook) return null;

  const [recipe] = await db
    .update(recipes)
    .set({ cookbookId, updatedAt: new Date() })
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
    .returning();

  return recipe ?? null;
}

export async function removeRecipeFromCookbook(
  userId: string,
  cookbookId: string,
  recipeId: string
) {
  const [recipe] = await db
    .update(recipes)
    .set({ cookbookId: null, updatedAt: new Date() })
    .where(
      and(
        eq(recipes.id, recipeId),
        eq(recipes.userId, userId),
        eq(recipes.cookbookId, cookbookId)
      )
    )
    .returning();

  return recipe ?? null;
}
