import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cookingSessions } from "@/lib/db/schema";

export async function createCookingSession(
  userId: string,
  recipeId: string,
  voiceEnabled: boolean
) {
  const [session] = await db
    .insert(cookingSessions)
    .values({
      userId,
      recipeId,
      voiceEnabled,
      status: "active",
      currentStep: 1,
      messages: [],
    })
    .returning();

  return session;
}

export async function appendCookingMessage(
  userId: string,
  sessionId: string,
  content: string,
  assistantContent: string,
  timerSeconds?: number | null,
  currentStep?: number | null
) {
  const session = await db.query.cookingSessions.findFirst({
    where: and(eq(cookingSessions.id, sessionId), eq(cookingSessions.userId, userId)),
  });

  if (!session) return null;

  const messages = Array.isArray(session.messages) ? [...session.messages] : [];
  const now = new Date().toISOString();
  messages.push({ role: "user", content, timestamp: now, type: "text" });
  messages.push({
    role: "assistant",
    content: assistantContent,
    timestamp: now,
    type: "text",
  });
  if (timerSeconds && timerSeconds > 0) {
    messages.push({
      role: "assistant",
      content: `Timer set for ${timerSeconds} seconds.`,
      timestamp: now,
      type: "timer",
      timer_seconds: timerSeconds,
    });
  }

  const nextStep = currentStep ?? session.currentStep ?? 1;
  const [updated] = await db
    .update(cookingSessions)
    .set({
      messages,
      currentStep: nextStep,
    })
    .where(eq(cookingSessions.id, sessionId))
    .returning();

  return updated;
}

export async function endCookingSession(userId: string, sessionId: string) {
  const [session] = await db
    .update(cookingSessions)
    .set({ status: "completed", endedAt: new Date() })
    .where(and(eq(cookingSessions.id, sessionId), eq(cookingSessions.userId, userId)))
    .returning();

  return session ?? null;
}

export async function listCookingSessions(userId: string) {
  return db.query.cookingSessions.findMany({
    where: eq(cookingSessions.userId, userId),
    orderBy: desc(cookingSessions.startedAt),
  });
}
