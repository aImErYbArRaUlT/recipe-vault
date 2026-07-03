const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const RETRY_DELAYS_MS = [1000, 2000, 4000];

class GeminiTransientError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GeminiTransientError";
    this.status = status;
  }
}

async function requestGemini(apiKey: string, body: string, attempt = 0) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }
  );

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    if ((response.status === 429 || response.status === 503) && attempt < RETRY_DELAYS_MS.length) {
      const delay = RETRY_DELAYS_MS[attempt];
      await new Promise((resolve) => setTimeout(resolve, delay));
      return requestGemini(apiKey, body, attempt + 1);
    }
    throw new GeminiTransientError(
      response.status,
      `Gemini request failed (${response.status}): ${errBody.slice(0, 200)}`
    );
  }

  return response.json() as Promise<{
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  }>;
}

export interface GeminiScanResult {
  rawText: string | null;
  parsedRecipe: Record<string, unknown> | null;
  confidence: number | null;
}

export function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function mimeFromUrl(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
    gif: "image/gif",
    bmp: "image/bmp",
    tiff: "image/tiff",
  };
  return map[ext ?? ""] ?? "image/jpeg";
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);

  const contentType = res.headers.get("content-type");
  const buffer = Buffer.from(await res.arrayBuffer());
  const mimeType = contentType && contentType.startsWith("image/")
    ? contentType.split(";")[0]
    : mimeFromUrl(url);

  return { base64: buffer.toString("base64"), mimeType };
}

export async function scanRecipeFromImages(imageUrls: string[]): Promise<GeminiScanResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  if (imageUrls.length === 0) {
    return { rawText: null, parsedRecipe: null, confidence: null };
  }

  const prompt = `Extract a structured recipe JSON from the image(s). Multiple images are pages or angles of the SAME recipe; combine them into one recipe. Return JSON only.
Required fields:
title, description, ingredients (array), steps (array), prep_time_minutes, cook_time_minutes,
total_time_minutes, servings, cuisine, tags (array), difficulty, nutrition (object),
confidence (number 0 to 1 for how clearly the recipe could be read).
Each ingredient: { name, quantity, unit, preparation, group, optional }.
Each step: { order, instruction, timer_seconds, tips }.`;

  // Send every page so multi-image scans are read as one recipe.
  const images = await Promise.all(imageUrls.map(fetchImageAsBase64));
  const parts = [
    { text: prompt },
    ...images.map((img) => ({
      inlineData: { data: img.base64, mimeType: img.mimeType },
    })),
  ];

  const requestBody = JSON.stringify({
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0.2 },
  });

  const data = await requestGemini(apiKey, requestBody);

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  const parsedRecipe = rawText ? extractJson(rawText) : null;
  const rawConfidence = parsedRecipe?.confidence;
  const confidence =
    typeof rawConfidence === "number"
      ? Math.max(0, Math.min(1, rawConfidence))
      : null;

  return { rawText, parsedRecipe, confidence };
}

export function isGeminiTransientError(error: unknown): boolean {
  return error instanceof GeminiTransientError;
}

export async function generateText(prompt: string, temperature = 0.3) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const requestBody = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: { temperature },
  });

  const data = await requestGemini(apiKey, requestBody);
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function generateCookingAssistantResponse(input: {
  recipe: {
    title: string;
    ingredients: unknown[];
    steps: unknown[];
  };
  currentStep: number;
  messages: Array<{ role: string; content: string }>;
  userMessage: string;
}) {
  const { COOKING_KNOWLEDGE } = await import("./cooking-knowledge");

  const hasSteps = input.recipe.steps.length > 0;
  const hasIngredients = input.recipe.ingredients.length > 0;

  let recipeSection = `Title: ${input.recipe.title}\n`;
  if (hasIngredients) {
    recipeSection += `Ingredients: ${JSON.stringify(input.recipe.ingredients)}\n`;
  } else {
    recipeSection += `Ingredients: Not provided. Infer from the dish title and help the user.\n`;
  }
  if (hasSteps) {
    recipeSection += `Steps: ${JSON.stringify(input.recipe.steps)}\n`;
  } else {
    recipeSection += `Steps: Not provided. Use your expertise to guide the user through cooking this dish step by step.\n`;
  }

  const prompt = `${COOKING_KNOWLEDGE}

## CURRENT RECIPE
${recipeSection}
## SESSION
Current step: ${input.currentStep}
Conversation so far: ${JSON.stringify(input.messages)}

## USER
${input.userMessage}`;

  return generateText(prompt, 0.3);
}
