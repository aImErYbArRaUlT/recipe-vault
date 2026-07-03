import { z } from "zod";
import { createCredentialsUser } from "@/lib/services/users";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email/templates";
import { rateLimit } from "@/lib/middleware/rate-limit";

const limit = rateLimit({ limit: 5, windowMs: 60_000 });

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
});

export async function POST(req: Request) {
  const blocked = await limit("auth:signup");
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await createCredentialsUser(parsed.data);
  if (process.env.RESEND_API_KEY) {
    const message = welcomeEmail({ name: parsed.data.displayName });
    await sendEmail({ to: user.email, subject: message.subject, html: message.html });
  }
  return Response.json({ id: user.id, email: user.email });
}
