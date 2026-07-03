import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/middleware/with-auth";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { slugify, uniqueSlug } from "@/lib/slug";

export const POST = withAuth<{ id: string }>(async (_req, user, { params }) => {
  const { id } = await params;

  const recipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, id),
  });

  if (!recipe || recipe.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const base = slugify(recipe.title);
  const slug = uniqueSlug(base || "recipe");

  const [updated] = await db
    .update(recipes)
    .set({
      isPublic: true,
      publicSlug: slug,
      shareCount: (recipe.shareCount ?? 0) + 1,
      updatedAt: new Date(),
    })
    .where(eq(recipes.id, recipe.id))
    .returning();

  return Response.json({
    slug: updated.publicSlug,
    url: `/recipe/${updated.publicSlug}`,
  });
});

export const DELETE = withAuth<{ id: string }>(async (_req, user, { params }) => {
  const { id } = await params;

  const recipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, id),
  });

  if (!recipe || recipe.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(recipes)
    .set({ isPublic: false, publicSlug: null, updatedAt: new Date() })
    .where(eq(recipes.id, recipe.id));

  return Response.json({ status: "unshared" });
});
