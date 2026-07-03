import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, scanJobs } from "@/lib/db/schema";
import { isGeminiTransientError, scanRecipeFromImages, type GeminiScanResult } from "@/lib/ai/gemini";
import { createThumbnail } from "@/lib/images";
import { uploadFile } from "@/lib/r2";
import { buildStorageKey } from "@/lib/storage";

export async function createScanJob(userId: string, imageUrls: string[]) {
  const [job] = await db
    .insert(scanJobs)
    .values({
      userId,
      imageUrls,
      status: "processing",
    })
    .returning();

  return job;
}

export async function processScanJob(jobId: string) {
  const job = await db.query.scanJobs.findFirst({ where: eq(scanJobs.id, jobId) });
  if (!job) return null;

  try {
    const r2Origin = process.env.R2_PUBLIC_URL;
    if (!r2Origin) {
      throw new Error("R2_PUBLIC_URL is not configured");
    }
    // SSRF guard: every image must live on our R2 origin before we fetch it.
    for (const url of job.imageUrls) {
      if (!url.startsWith("https://") || new URL(url).origin !== new URL(r2Origin).origin) {
        throw new Error("Invalid image URL origin");
      }
    }

    const imageResponse = await fetch(job.imageUrls[0]);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch scan image");
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const thumbnailBuffer = await createThumbnail(imageBuffer);
    const thumbnailKey = buildStorageKey(
      "scan",
      job.userId,
      "thumbnail.webp",
      job.id
    );
    const thumbnailUrl = await uploadFile(
      thumbnailKey,
      thumbnailBuffer,
      "image/webp"
    );

    // Bounded retry on transient Gemini errors.
    const delays = [1000, 2000, 4000];
    let result: GeminiScanResult | null = null;
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      try {
        result = await scanRecipeFromImages(job.imageUrls);
        break;
      } catch (error) {
        if (!isGeminiTransientError(error) || attempt === delays.length) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
      }
    }
    if (!result) {
      throw new Error("Scan produced no result");
    }
    const [updated] = await db
      .update(scanJobs)
      .set({
        status: "completed",
        rawOcrText: result.rawText,
        parsedRecipe: result.parsedRecipe,
        confidence: result.confidence,
        thumbnailUrl,
        completedAt: new Date(),
      })
      .where(eq(scanJobs.id, job.id))
      .returning();
    return updated;
  } catch (error) {
    const [failed] = await db
      .update(scanJobs)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Scan failed",
        completedAt: new Date(),
      })
      .where(eq(scanJobs.id, job.id))
      .returning();
    return failed;
  }
}

export async function getScanJob(userId: string, jobId: string) {
  return db.query.scanJobs.findFirst({
    where: and(eq(scanJobs.id, jobId), eq(scanJobs.userId, userId)),
  });
}

interface ScanOverrides {
  title?: string;
  description?: string;
  prepTimeMinutes?: string;
  cookTimeMinutes?: string;
  totalTimeMinutes?: string;
  servings?: string;
  cuisine?: string;
  difficulty?: string;
  tags?: string;
}

function toIntOrNull(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return isNaN(n) || n <= 0 ? null : n;
}

export async function confirmScanJob(userId: string, jobId: string, overrides: ScanOverrides = {}) {
  const job = await db.query.scanJobs.findFirst({
    where: and(eq(scanJobs.id, jobId), eq(scanJobs.userId, userId)),
  });

  if (!job?.parsedRecipe || job.status !== "completed") {
    return null;
  }

  const parsed = job.parsedRecipe as Record<string, unknown>;

  const title = overrides.title?.trim() || String(parsed.title ?? "Untitled Recipe");
  const description = overrides.description?.trim() || (typeof parsed.description === "string" ? parsed.description : null);
  const tags = overrides.tags !== undefined
    ? overrides.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : (parsed.tags as string[]) ?? [];

  const [recipe] = await db
    .insert(recipes)
    .values({
      userId,
      title,
      description: description || null,
      sourceType: "scan",
      originalImageUrls: job.imageUrls,
      ocrRawText: job.rawOcrText,
      ocrConfidence: job.confidence,
      ingredients: (parsed.ingredients as object[]) ?? [],
      steps: (parsed.steps as object[]) ?? [],
      prepTimeMinutes: toIntOrNull(overrides.prepTimeMinutes ?? parsed.prep_time_minutes as string | number | undefined),
      cookTimeMinutes: toIntOrNull(overrides.cookTimeMinutes ?? parsed.cook_time_minutes as string | number | undefined),
      totalTimeMinutes: toIntOrNull(overrides.totalTimeMinutes ?? parsed.total_time_minutes as string | number | undefined),
      servings: toIntOrNull(overrides.servings ?? parsed.servings as string | number | undefined),
      cuisine: (overrides.cuisine?.trim() || (typeof parsed.cuisine === "string" ? parsed.cuisine : null)) || null,
      tags,
      difficulty: (overrides.difficulty?.trim() || (typeof parsed.difficulty === "string" ? parsed.difficulty : null)) || null,
      nutrition: (parsed.nutrition as object) ?? null,
    })
    .returning();

  await db
    .update(scanJobs)
    .set({ recipeId: recipe.id })
    .where(eq(scanJobs.id, job.id));

  return recipe;
}
