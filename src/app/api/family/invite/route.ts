import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { generateInviteCode } from "@/lib/services/family";
import { sendEmail } from "@/lib/email";
import { familyInviteEmail } from "@/lib/email/templates";

const schema = z.object({
  email: z.string().email().optional(),
});

export const POST = withAuth(async (req, user) => {
  const gate = await requireFeature("family_sharing")();
  if (gate) return gate;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const family = await generateInviteCode(user.id);
  if (!family) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.email && process.env.RESEND_API_KEY) {
    const inviteUrl = `${process.env.NEXTAUTH_URL ?? ""}/family?code=${family.inviteCode}`;
    const message = familyInviteEmail({
      inviteCode: family.inviteCode,
      inviteUrl,
    });
    await sendEmail({
      to: parsed.data.email,
      subject: message.subject,
      html: message.html,
    });
  }

  return Response.json({ inviteCode: family.inviteCode });
});
