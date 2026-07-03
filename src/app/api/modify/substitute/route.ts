import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { requireDailyAiCredit } from "@/lib/middleware/ai-limits";
import { extractJson, generateText } from "@/lib/ai/gemini";

const burst = rateLimit({ limit: 15, windowMs: 60_000 });

const schema = z.object({
  ingredient: z.string().min(1),
  dietary: z.string().optional(),
});

export const POST = withAuth(async (req, user) => {
  const gate = await requireFeature("ai_substitutions")();
  if (gate) return gate;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const tooMany = await burst("modify:substitute", user.id);
  if (tooMany) return tooMany;
  const overCap = await requireDailyAiCredit(user);
  if (overCap) return overCap;

  const prompt = `Suggest substitutions. Return ONLY JSON.
Ingredient: ${parsed.data.ingredient}
Dietary needs: ${parsed.data.dietary ?? "none"}
Return JSON: { suggestions: string[] }`;

  const text = await generateText(prompt, 0.2);
  const parsedJson = extractJson(text) as { suggestions?: string[] } | null;
  if (!parsedJson?.suggestions) {
    return Response.json({ error: "Unable to parse response" }, { status: 502 });
  }

  return Response.json({
    ingredient: parsed.data.ingredient,
    suggestions: parsedJson.suggestions,
  });
});
