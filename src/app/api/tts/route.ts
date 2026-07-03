import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { requireDailyAiCredit } from "@/lib/middleware/ai-limits";
import { rateLimit } from "@/lib/middleware/rate-limit";

const burst = rateLimit({ limit: 30, windowMs: 60_000 });

const schema = z.object({
  text: z.string().min(1).max(4096),
});

export const POST = withAuth(async (req, user) => {
  const gate = await requireFeature("ai_voice_companion")();
  if (gate) return gate;

  const tooMany = await burst("tts", user.id);
  if (tooMany) return tooMany;

  const cap = await requireDailyAiCredit(user);
  if (cap) return cap;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "TTS not configured" }, { status: 501 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const voice = process.env.OPENAI_TTS_VOICE ?? "coral";
  const model = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
  const speed = parseFloat(process.env.OPENAI_TTS_SPEED ?? "1.0");
  const instructions = process.env.OPENAI_TTS_INSTRUCTIONS ??
    "Speak in a warm, friendly, and conversational tone. You are a helpful cooking companion guiding someone through a recipe in their kitchen. Be encouraging and natural.";

  const payload: Record<string, unknown> = {
    model,
    input: parsed.data.text,
    voice,
    speed,
    response_format: "mp3",
  };

  if (model.startsWith("gpt-4o")) {
    payload.instructions = instructions;
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    return Response.json(
      { error: `TTS failed: ${response.status}`, detail: errText.slice(0, 200) },
      { status: 502 }
    );
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache",
    },
  });
});
