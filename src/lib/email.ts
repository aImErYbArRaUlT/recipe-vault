import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM ?? "Recipe Vault <noreply@example.com>";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}
