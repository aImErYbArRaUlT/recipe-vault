import { z } from "zod";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const record = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, parsed.data.email),
      eq(verificationTokens.token, parsed.data.token),
      gt(verificationTokens.expires, new Date())
    ),
  });

  if (!record) {
    return Response.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  if (!user?.passwordHash) {
    return Response.json({ error: "Password not set" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, parsed.data.email));

  return Response.json({ status: "updated" });
}
