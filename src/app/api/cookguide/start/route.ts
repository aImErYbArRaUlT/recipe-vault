import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { createCookingSession } from "@/lib/services/cookguide";

const burst = rateLimit({ limit: 5, windowMs: 60_000 });

const schema = z.object({
  recipeId: z.string().min(1),
  voiceEnabled: z.boolean().optional().default(false),
});

export const POST = withAuth(async (req, user) => {
  const gate = await requireFeature("ai_voice_companion")();
  if (gate) return gate;
  const tooMany = await burst("cookguide:start", user.id);
  if (tooMany) return tooMany;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const session = await createCookingSession(
    user.id,
    parsed.data.recipeId,
    parsed.data.voiceEnabled
  );

  return Response.json(session, { status: 201 });
});
