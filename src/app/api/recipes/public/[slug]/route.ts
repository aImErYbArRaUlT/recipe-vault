import { getPublicRecipe } from "@/lib/middleware/data-access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const recipe = await getPublicRecipe(slug);
  if (!recipe) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(recipe);
}
