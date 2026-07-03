import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { requireDailyAiCredit } from "@/lib/middleware/ai-limits";
import { extractJson, generateText } from "@/lib/ai/gemini";

const burst = rateLimit({ limit: 5, windowMs: 60_000 });

const schema = z.object({
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().optional(),
      unit: z.string().optional(),
    })
  ),
});

export const POST = withAuth(async (req, user) => {
  const gate = await requireFeature("ai_nutrition")();
  if (gate) return gate;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const tooMany = await burst("modify:nutrition", user.id);
  if (tooMany) return tooMany;
  const overCap = await requireDailyAiCredit(user);
  if (overCap) return overCap;

  const prompt = `Estimate nutrition for the recipe ingredients. Return ONLY JSON.
Ingredients: ${JSON.stringify(parsed.data.ingredients)}
Return JSON with keys: calories, protein_g, carbs_g, fat_g, fiber_g.`;

  const text = await generateText(prompt, 0.2);
  const nutrition = extractJson(text);
  if (!nutrition) {
    return Response.json({ error: "Unable to parse response" }, { status: 502 });
  }

  return Response.json(nutrition);
});
