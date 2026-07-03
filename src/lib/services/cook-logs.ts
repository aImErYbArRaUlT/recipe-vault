import { and, eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { cookLogs } from "@/lib/db/schema";

export async function listCookLogs(userId: string, recipeId: string) {
  return db.query.cookLogs.findMany({
    where: and(eq(cookLogs.userId, userId), eq(cookLogs.recipeId, recipeId)),
    orderBy: desc(cookLogs.cookedAt),
  });
}

export async function createCookLog(
  userId: string,
  recipeId: string,
  input: {
    rating?: number | null;
    notes?: string | null;
    wouldMakeAgain?: boolean | null;
  }
) {
  const [log] = await db
    .insert(cookLogs)
    .values({
      userId,
      recipeId,
      rating: input.rating ?? null,
      notes: input.notes ?? null,
      wouldMakeAgain: input.wouldMakeAgain ?? null,
    })
    .returning();

  return log;
}

export async function updateCookLog(
  userId: string,
  logId: string,
  input: {
    rating?: number | null;
    notes?: string | null;
    wouldMakeAgain?: boolean | null;
  }
) {
  const [log] = await db
    .update(cookLogs)
    .set({
      rating: input.rating ?? null,
      notes: input.notes ?? null,
      wouldMakeAgain: input.wouldMakeAgain ?? null,
    })
    .where(and(eq(cookLogs.id, logId), eq(cookLogs.userId, userId)))
    .returning();

  return log ?? null;
}

export async function deleteCookLog(userId: string, logId: string) {
  const [log] = await db
    .delete(cookLogs)
    .where(and(eq(cookLogs.id, logId), eq(cookLogs.userId, userId)))
    .returning();

  return log ?? null;
}
