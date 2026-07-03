/* @vitest-environment node */
import { trialReminderEmail } from "@/lib/email/templates/trial-reminder";

describe("trialReminderEmail", () => {
  const baseCtaUrl = "https://example.com/settings/billing";

  it("uses day-1 copy when 2 days remain", () => {
    const email = trialReminderEmail({
      daysRemaining: 2,
      ctaUrl: baseCtaUrl,
    });
    expect(email.subject).toMatch(/day one/i);
    expect(email.html).toContain("Day one in");
  });

  it("uses day-2 copy when 1 day remains", () => {
    const email = trialReminderEmail({
      daysRemaining: 1,
      ctaUrl: baseCtaUrl,
    });
    expect(email.subject).toMatch(/one day left/i);
    expect(email.html).toContain("One day left");
  });

  it("uses day-3 copy when 0 days remain", () => {
    const email = trialReminderEmail({
      daysRemaining: 0,
      ctaUrl: baseCtaUrl,
    });
    expect(email.subject).toMatch(/wrapped up/i);
    expect(email.html).toContain("Trial complete");
  });

  it("respects explicit milestone over daysRemaining", () => {
    const email = trialReminderEmail({
      daysRemaining: 5,
      milestone: 3,
      ctaUrl: baseCtaUrl,
    });
    expect(email.html).toContain("Trial complete");
  });

  it("personalizes greeting with first name", () => {
    const email = trialReminderEmail({
      milestone: 1,
      ctaUrl: baseCtaUrl,
      displayName: "Maria Bianchi",
    });
    expect(email.html).toContain("Hi Maria,");
  });

  it("falls back to generic greeting without displayName", () => {
    const email = trialReminderEmail({ milestone: 1, ctaUrl: baseCtaUrl });
    expect(email.html).toContain("Hello,");
  });

  it("includes the CTA URL in the button", () => {
    const email = trialReminderEmail({
      milestone: 2,
      ctaUrl: "https://example.com/upgrade",
    });
    expect(email.html).toContain('href="https://example.com/upgrade"');
  });

  it("uses Recipe Vault brand colors in the template", () => {
    const email = trialReminderEmail({ milestone: 1, ctaUrl: baseCtaUrl });
    expect(email.html).toContain("#c35a38"); // terracotta accent
    expect(email.html).toContain("#f7f2ea"); // paper background
  });

  it("includes a formatted trial end date for in-flight reminders", () => {
    const endsAt = new Date("2026-05-16T12:00:00Z");
    const email = trialReminderEmail({
      milestone: 2,
      ctaUrl: baseCtaUrl,
      trialEndsAt: endsAt,
    });
    expect(email.html).toMatch(/Trial ends [A-Z][a-z]+, [A-Z][a-z]+ \d+\./);
  });

  it("omits the end-date line on the trial-complete email", () => {
    const email = trialReminderEmail({
      milestone: 3,
      ctaUrl: baseCtaUrl,
      trialEndsAt: new Date("2026-05-16T12:00:00Z"),
    });
    expect(email.html).not.toContain("Trial ends");
  });
});
