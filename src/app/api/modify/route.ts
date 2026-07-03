import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { eq } from "drizzle-orm";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { requireDailyAiCredit } from "@/lib/middleware/ai-limits";
import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { extractJson, generateText } from "@/lib/ai/gemini";

const burst = rateLimit({ limit: 15, windowMs: 60_000 });

const schema = z.object({
  recipeId: z.string().min(1),
  request: z.string().min(1),
});

export const POST = withAuth(async (req, user) => {
  const gate = await requireFeature("ai_modifications")();
  if (gate) return gate;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const tooMany = await burst("modify", user.id);
  if (tooMany) return tooMany;
  const overCap = await requireDailyAiCredit(user);
  if (overCap) return overCap;

  const recipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, parsed.data.recipeId),
  });

  if (!recipe || recipe.userId !== user.id) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const prompt = `You are modifying a recipe. Return ONLY JSON.
Recipe: ${JSON.stringify({
    title: recipe.title,
    description: recipe.description,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    prep_time_minutes: recipe.prepTimeMinutes,
    cook_time_minutes: recipe.cookTimeMinutes,
    total_time_minutes: recipe.totalTimeMinutes,
    servings: recipe.servings,
    cuisine: recipe.cuisine,
    tags: recipe.tags,
    difficulty: recipe.difficulty,
    nutrition: recipe.nutrition,
  })}
User request: ${parsed.data.request}
Return the full updated recipe JSON.`;

  const text = await generateText(prompt, 0.2);
  const modified = extractJson(text);
  if (!modified) {
    return Response.json({ error: "Unable to parse response" }, { status: 502 });
  }

  return Response.json({ recipe: modified });
});
