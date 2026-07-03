type Milestone = 1 | 2 | 3;

type Copy = {
  subject: string;
  heading: string;
  body: string;
  cta: string;
};

const COPY_BY_MILESTONE: Record<Milestone, Copy> = {
  1: {
    subject: "Day one of your Pro trial",
    heading: "Day one in",
    body:
      "You've got two full days of Pro left. The two things most members say turn them into believers: scan a handwritten recipe (Pro only) and try cooking with the voice companion. Five minutes each.",
    cta: "Open the vault",
  },
  2: {
    subject: "One day left in your Pro trial",
    heading: "One day left",
    body:
      "Your Pro trial wraps up tomorrow. To keep AI scanning, the voice cooking companion, and unlimited cookbooks, pick a plan from Settings. Your recipes stay with you either way.",
    cta: "Pick a plan",
  },
  3: {
    subject: "Your Pro trial has wrapped up",
    heading: "Trial complete",
    body:
      "Your Pro trial has ended. Your recipes are safe and you're on the Free plan now. Upgrade to Pro any time to bring back AI scanning, voice cooking, and unlimited cookbooks.",
    cta: "See plans",
  },
};

function formatDate(d?: Date | null): string | null {
  if (!d) return null;
  try {
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export function trialReminderEmail(input: {
  daysRemaining?: number;
  milestone?: Milestone;
  ctaUrl: string;
  displayName?: string | null;
  trialEndsAt?: Date | null;
}) {
  const milestone: Milestone =
    input.milestone ??
    (input.daysRemaining === undefined
      ? 2
      : input.daysRemaining <= 0
        ? 3
        : input.daysRemaining === 1
          ? 2
          : 1);
  const copy = COPY_BY_MILESTONE[milestone];
  const greeting = input.displayName
    ? `Hi ${input.displayName.split(" ")[0]},`
    : "Hello,";

  const endDateLabel = formatDate(input.trialEndsAt ?? null);
  const endLine =
    endDateLabel && milestone !== 3
      ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#847a6f;">Trial ends ${endDateLabel}.</p>`
      : "";

  return {
    subject: copy.subject,
    html: `
<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f7f2ea;color:#1f1a17;font-family:ui-sans-serif,system-ui,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f7f2ea;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#fffaf5;border:1px solid #e6d8cd;border-radius:18px;box-shadow:0 1px 0 rgba(31,26,23,0.04),0 4px 14px -2px rgba(31,26,23,0.06);overflow:hidden;">
        <tr><td style="padding:32px 32px 8px;">
          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#c35a38;">Recipe Vault</p>
          <h1 style="margin:14px 0 0;font-family:'Iowan Old Style',Georgia,serif;font-size:32px;font-weight:500;line-height:1.05;letter-spacing:-0.02em;color:#1f1a17;">${copy.heading}</h1>
        </td></tr>
        <tr><td style="padding:18px 32px 0;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1f1a17;">${greeting}</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#5c544c;">${copy.body}</p>
          ${endLine}
        </td></tr>
        <tr><td style="padding:28px 32px 32px;">
          <a href="${input.ctaUrl}" style="display:inline-block;padding:14px 28px;border-radius:9999px;background:#c35a38;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border:1px solid #9a4225;">${copy.cta}</a>
        </td></tr>
        <tr><td style="padding:18px 32px 32px;border-top:1px solid #efe6d8;">
          <p style="margin:0;font-size:11px;line-height:1.6;color:#847a6f;">Your recipes are kept safely for 60 days after the trial ends, even on the Free plan.</p>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:11px;color:#847a6f;font-style:italic;">For the recipes too good to be lost in a drawer.</p>
    </td></tr>
  </table>
</body>
</html>
    `,
  };
}
