import { z } from "zod";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates";

const limit = rateLimit({ limit: 5, windowMs: 60_000 });

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const blocked = await limit("auth:forgot-password");
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, parsed.data.email),
  });

  if (!user?.passwordHash) {
    return Response.json({ status: "queued" });
  }

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, parsed.data.email));

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(verificationTokens).values({
    identifier: parsed.data.email,
    token,
    expires,
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  if (baseUrl && process.env.RESEND_API_KEY) {
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(
      parsed.data.email
    )}`;
    const message = passwordResetEmail({ resetUrl });
    await sendEmail({ to: parsed.data.email, subject: message.subject, html: message.html });
  }

  if (process.env.NODE_ENV !== "production") {
    return Response.json({ status: "queued", token });
  }

  return Response.json({ status: "queued" });
}
