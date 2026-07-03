import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { createRecipe, listRecipes } from "@/lib/services/recipes";

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  preparation: z.string().optional(),
  optional: z.boolean().optional(),
  group: z.string().optional(),
});

const stepSchema = z.object({
  instruction: z.string().min(1),
  timerSeconds: z.number().nullable().optional(),
  order: z.number().optional(),
});

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  ingredients: z.array(ingredientSchema).optional(),
  steps: z.array(stepSchema).optional(),
  prepTimeMinutes: z.number().int().nullable().optional(),
  cookTimeMinutes: z.number().int().nullable().optional(),
  totalTimeMinutes: z.number().int().nullable().optional(),
  servings: z.number().int().nullable().optional(),
  cuisine: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.string().nullable().optional(),
  nutrition: z.record(z.string(), z.any()).nullable().optional(),
});

export const GET = withAuth(async (_req, user) => {
  const recipes = await listRecipes(user.id);
  return Response.json(recipes);
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const recipe = await createRecipe(user.id, parsed.data);
  return Response.json(recipe, { status: 201 });
});
