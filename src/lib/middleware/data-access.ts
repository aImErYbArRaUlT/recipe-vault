import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cookbooks, recipes, sharedRecipes, users } from "@/lib/db/schema";

export async function getUserRecipes(
  userId: string,
  options?: {
    search?: string;
    cookbook?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  }
) {
  return db.query.recipes.findMany({
    where: and(
      eq(recipes.userId, userId),
      isNull(recipes.deletedAt),
      options?.cookbook ? eq(recipes.cookbookId, options.cookbook) : undefined,
      options?.search
        ? sql`to_tsvector('english', ${recipes.title}) @@ plainto_tsquery('english', ${options.search})`
        : undefined
    ),
    limit: options?.limit ?? 50,
    offset: ((options?.page ?? 1) - 1) * (options?.limit ?? 50),
    orderBy: desc(recipes.updatedAt),
  });
}

export async function getFamilySharedRecipes(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user?.familyId) return [];

  return db
    .select()
    .from(sharedRecipes)
    .innerJoin(cookbooks, eq(sharedRecipes.cookbookId, cookbooks.id))
    .innerJoin(recipes, eq(sharedRecipes.recipeId, recipes.id))
    .where(and(eq(cookbooks.familyId, user.familyId), eq(cookbooks.isShared, true)));
}

export async function getPublicRecipe(slug: string) {
  // Public projection: hide internal and owner-identifying columns.
  return db.query.recipes.findFirst({
    where: and(eq(recipes.publicSlug, slug), eq(recipes.isPublic, true), isNull(recipes.deletedAt)),
    columns: {
      userId: false,
      cookbookId: false,
      ocrRawText: false,
      ocrConfidence: false,
      originalImageUrls: false,
      forkedFromUser: false,
      deletedAt: false,
    },
  });
}

export async function assertOwnership(userId: string, recipeId: string): Promise<void> {
  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, recipeId), eq(recipes.userId, userId)),
  });

  if (!recipe) {
    throw new Error("Not found or not authorized");
  }
}
