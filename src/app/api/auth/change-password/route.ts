import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/middleware/with-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const schema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!dbUser?.passwordHash) {
    return Response.json({ error: "Password not set" }, { status: 400 });
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);
  if (!valid) {
    return Response.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return Response.json({ status: "updated" });
});
