import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recipes, scanJobs } from "@/lib/db/schema";
import { isGeminiTransientError, scanRecipeFromImages, type GeminiScanResult } from "@/lib/ai/gemini";
import { createThumbnail } from "@/lib/images";
import { uploadFile } from "@/lib/r2";
import { buildStorageKey } from "@/lib/storage";
import { toRecipeSnapshot, toRecipeWriteFields } from "@/lib/services/recipe-snapshot";

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
  const snapshot = toRecipeSnapshot({
    ...parsed,
    title,
    description: description || null,
    tags,
    prep_time_minutes: overrides.prepTimeMinutes ?? parsed.prep_time_minutes,
    cook_time_minutes: overrides.cookTimeMinutes ?? parsed.cook_time_minutes,
    total_time_minutes: overrides.totalTimeMinutes ?? parsed.total_time_minutes,
    servings: overrides.servings ?? parsed.servings,
    cuisine: overrides.cuisine?.trim() || parsed.cuisine,
    difficulty: overrides.difficulty?.trim() || parsed.difficulty,
  });

  const [recipe] = await db
    .insert(recipes)
    .values({
      userId,
      sourceType: "scan",
      originalImageUrls: job.imageUrls,
      ocrRawText: job.rawOcrText,
      ocrConfidence: job.confidence,
      ...toRecipeWriteFields(snapshot),
    })
    .returning();

  await db
    .update(scanJobs)
    .set({ recipeId: recipe.id })
    .where(eq(scanJobs.id, job.id));

  return recipe;
}
