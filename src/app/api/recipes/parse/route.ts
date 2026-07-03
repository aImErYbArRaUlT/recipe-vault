import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { requireDailyAiCredit } from "@/lib/middleware/ai-limits";
import { generateText, extractJson } from "@/lib/ai/gemini";

const burst = rateLimit({ limit: 10, windowMs: 60_000 });

const schema = z.object({
  text: z.string().min(10).max(20_000),
});

const PARSE_PROMPT = `Parse the following text into a structured recipe JSON. Return JSON only, no markdown fences.
Required fields:
title (string), description (string), ingredients (array), steps (array),
prepTimeMinutes (number or null), cookTimeMinutes (number or null),
totalTimeMinutes (number or null), servings (number or null),
cuisine (string or null), tags (string array), difficulty ("easy"|"medium"|"hard" or null).
Each ingredient: { name, quantity (number or null), unit (string or null), preparation (string or null) }.
Each step: { instruction, timerSeconds (number or null) }.
Infer missing fields from context when possible. If a field cannot be determined, use null.

TEXT:
`;

export const POST = withAuth(async (req, user) => {
  const gate = await requireFeature("ai_scanning")();
  if (gate) return gate;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const tooMany = await burst("recipes:parse", user.id);
  if (tooMany) return tooMany;
  const overCap = await requireDailyAiCredit(user);
  if (overCap) return overCap;

  const raw = await generateText(PARSE_PROMPT + parsed.data.text, 0.2);
  const recipe = extractJson(raw);

  if (!recipe) {
    return Response.json({ error: "Could not parse recipe from text" }, { status: 422 });
  }

  return Response.json(recipe);
});
