import { z } from "zod";
import { eq } from "drizzle-orm";
import { toClientUser } from "@/lib/auth-helpers";
import { withAuth } from "@/lib/middleware/with-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const updateSchema = z.object({
  name: z.string().optional(),
  displayName: z.string().optional(),
  skillLevel: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  measurementSystem: z.string().optional(),
  defaultServings: z.number().int().optional(),
  voiceEnabled: z.boolean().optional(),
});

export const GET = withAuth(async (_req, user) => {
  return Response.json(toClientUser(user));
});

export const PATCH = withAuth(async (req, user) => {
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const displayName = parsed.data.displayName ?? parsed.data.name ?? undefined;
  const name = parsed.data.name ?? parsed.data.displayName ?? undefined;

  const [updated] = await db
    .update(users)
    .set({
      ...parsed.data,
      name,
      displayName,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning();

  return Response.json(toClientUser(updated));
});

export const DELETE = withAuth(async (_req, user) => {
  await db.delete(users).where(eq(users.id, user.id));
  return Response.json({ status: "deleted" });
});
