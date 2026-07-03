import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { requireDailyAiCredit } from "@/lib/middleware/ai-limits";
import { rateLimit } from "@/lib/middleware/rate-limit";

const burst = rateLimit({ limit: 30, windowMs: 60_000 });

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/m4a",
  "audio/ogg",
  "audio/x-m4a",
]);

export const POST = withAuth(async (req, user) => {
  const gate = await requireFeature("ai_voice_companion")();
  if (gate) return gate;

  const tooMany = await burst("stt", user.id);
  if (tooMany) return tooMany;

  const cap = await requireDailyAiCredit(user);
  if (cap) return cap;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "STT not configured" }, { status: 501 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const audio = formData.get("audio");
  if (!(audio instanceof File)) {
    return Response.json({ error: "Missing audio file" }, { status: 400 });
  }

  if (audio.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File too large (25MB max)" }, { status: 400 });
  }

  if (audio.type && !ALLOWED_TYPES.has(audio.type)) {
    return Response.json({ error: "Unsupported audio format" }, { status: 400 });
  }

  const whisperForm = new FormData();
  whisperForm.append("file", audio, audio.name || "audio.webm");
  whisperForm.append("model", "whisper-1");
  whisperForm.append("language", "en");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: whisperForm,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    return Response.json(
      { error: `STT failed: ${response.status}`, detail: errText.slice(0, 200) },
      { status: 502 },
    );
  }

  const result = await response.json();
  return Response.json({ text: result.text ?? "" });
});
