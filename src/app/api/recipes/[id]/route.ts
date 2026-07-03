import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { getRecipe, softDeleteRecipe, updateRecipe } from "@/lib/services/recipes";

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

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
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
  changesSummary: z.string().optional(),
});

export const GET = withAuth<{ id: string }>(async (_req, user, { params }) => {
  const { id } = await params;
  const recipe = await getRecipe(user.id, id);
  if (!recipe) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(recipe);
});

export const PATCH = withAuth<{ id: string }>(async (req, user, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const recipe = await updateRecipe(user.id, id, parsed.data);
  if (!recipe) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(recipe);
});

export const DELETE = withAuth<{ id: string }>(async (_req, user, { params }) => {
  const { id } = await params;
  const recipe = await softDeleteRecipe(user.id, id);
  if (!recipe) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ status: "deleted" });
});
