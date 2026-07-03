import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { requireDailyAiCredit } from "@/lib/middleware/ai-limits";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cookingSessions, recipes } from "@/lib/db/schema";
import { generateCookingAssistantResponse } from "@/lib/ai/gemini";
import { appendCookingMessage } from "@/lib/services/cookguide";

const burst = rateLimit({ limit: 20, windowMs: 60_000 });

const schema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1),
  timerSeconds: z.number().int().positive().optional(),
  currentStep: z.number().int().min(1).optional(),
});

export const POST = withAuth(async (req, user) => {
  const gate = await requireFeature("ai_voice_companion")();
  if (gate) return gate;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const tooMany = await burst("cookguide:message", user.id);
  if (tooMany) return tooMany;
  const overCap = await requireDailyAiCredit(user);
  if (overCap) return overCap;

  const session = await db.query.cookingSessions.findFirst({
    where: and(eq(cookingSessions.id, parsed.data.sessionId), eq(cookingSessions.userId, user.id)),
  });

  if (!session) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const recipe = await db.query.recipes.findFirst({
    where: and(eq(recipes.id, session.recipeId), eq(recipes.userId, user.id)),
  });

  if (!recipe) {
    return Response.json({ error: "Recipe not found" }, { status: 404 });
  }

  const history = Array.isArray(session.messages)
    ? session.messages
        .filter((msg: { role?: string; content?: string }) => msg?.content)
        .slice(-6)
        .map((msg: { role?: string; content?: string }) => ({
          role: msg.role ?? "user",
          content: msg.content ?? "",
        }))
    : [];

  const rawResponse = await generateCookingAssistantResponse({
    recipe: {
      title: recipe.title,
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    },
    currentStep: session.currentStep ?? 1,
    messages: history,
    userMessage: parsed.data.message,
  });

  const timerMatch = rawResponse.match(/TIMER:\s*(\d+)/i);
  const timerSeconds = timerMatch ? Number(timerMatch[1]) : parsed.data.timerSeconds;
  const assistantContent = rawResponse.replace(/TIMER:\s*\d+/i, "").trim();

  const updated = await appendCookingMessage(
    user.id,
    parsed.data.sessionId,
    parsed.data.message,
    assistantContent,
    timerSeconds,
    parsed.data.currentStep
  );

  if (!updated) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const message = {
    role: "assistant",
    content: assistantContent,
  };

  const chunks = assistantContent.match(/.{1,80}/g) ?? [assistantContent];

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      chunks.forEach((chunk, index) => {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              content: chunk,
              stream: true,
              start: index === 0,
              final: index === chunks.length - 1,
            })}\n\n`
          )
        );
      });
      if (timerSeconds) {
        controller.enqueue(
          encoder.encode(`event: timer\n` + `data: ${JSON.stringify({ seconds: timerSeconds })}\n\n`)
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
