import type { Metadata } from "next";
import { LegalShell, LegalSection } from "../legal-shell";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Recipe Vault collects, stores, and uses your information.",
};

export default function PrivacyPage() {
  return (
    <LegalShell eyebrow="Legal" title="Privacy policy" updated="May 13, 2026">
      <p>
        Recipe Vault (the &ldquo;Service&rdquo;) is operated by Recipe Vault. This
        policy explains what we collect, how we use it, and the choices you
        have. It applies to the web app and the iOS and
        Android apps.
      </p>

      <LegalSection number="01." title="What we collect">
        <p>
          <strong>Account information.</strong> When you sign up we store your
          email, display name, password hash (using bcrypt), and basic
          preferences (skill level, dietary restrictions, measurement system).
          You can edit or remove these at any time from Settings.
        </p>
        <p>
          <strong>Recipes and scans.</strong> Recipes you create or scan are
          stored against your account. Original scan images are kept in
          Cloudflare R2 alongside derived thumbnails. Cooking journal entries
          (ratings, notes, modifications) are stored as you save them.
        </p>
        <p>
          <strong>Billing.</strong> If you subscribe, Stripe or Apple/Google
          (depending on platform) handles payment. We never see or store your
          card number; we store only the subscription status and Stripe
          customer ID needed to manage your plan.
        </p>
        <p>
          <strong>Usage and diagnostics.</strong> We use PostHog for product
          analytics (page views, feature usage) and Sentry for error reporting.
          Both can be configured to exclude IP addresses on request.
        </p>
        <p>
          <strong>AI interactions.</strong> When you use AI features (recipe
          scanning, voice cooking, modifications, nutrition estimation), the
          relevant recipe text and your message are sent to Google Gemini and,
          for voice, OpenAI Whisper / TTS. We do not allow these providers to
          train on your data.
        </p>
      </LegalSection>

      <LegalSection number="02." title="How we use it">
        <p>To provide the Service, including:</p>
        <ul className="grid gap-1.5 list-disc pl-5">
          <li>Hosting and serving your recipes across your devices</li>
          <li>Running AI scanning and cooking guidance</li>
          <li>Processing payments and managing your subscription</li>
          <li>Sending transactional emails (welcome, trial reminders, password resets, family invites)</li>
          <li>Diagnosing errors and improving the product</li>
        </ul>
        <p>We do not sell your data. We do not show third-party ads.</p>
      </LegalSection>

      <LegalSection number="03." title="Who we share with">
        <p>
          We use these processors to operate the Service. Each receives only
          the data needed for their function:
        </p>
        <ul className="grid gap-1.5 list-disc pl-5">
          <li>Railway - hosting and Postgres</li>
          <li>Cloudflare R2 - image storage</li>
          <li>Google (Gemini, OAuth) - AI inference and sign-in</li>
          <li>OpenAI - voice transcription and TTS</li>
          <li>Stripe - web payments</li>
          <li>RevenueCat / Apple / Google - mobile in-app purchases</li>
          <li>Resend - transactional email</li>
          <li>PostHog - product analytics</li>
          <li>Sentry - error reporting</li>
        </ul>
      </LegalSection>

      <LegalSection number="04." title="Your rights">
        <p>You can at any time:</p>
        <ul className="grid gap-1.5 list-disc pl-5">
          <li>Export your recipes (from Settings &rarr; Account)</li>
          <li>Delete your account, which removes recipes, scans, and cook logs within 30 days</li>
          <li>Reset your password</li>
          <li>Opt out of non-essential email</li>
        </ul>
        <p>
          If you are in the EU, UK, or California, you have additional rights
          under GDPR / CCPA: access, correction, portability, erasure, and
          objection. Open an issue on the GitHub repository and we will respond
          within 30 days.
        </p>
      </LegalSection>

      <LegalSection number="05." title="Retention">
        <p>
          We keep your account data while your account is active. After
          deletion, recipes and scans are purged within 30 days from primary
          storage and within 90 days from backups. Cook logs and journal
          entries are deleted along with the account.
        </p>
        <p>
          If your subscription lapses, your recipes remain accessible (read
          only) for 60 days, after which we email a final warning and archive
          your data for an additional 60 days before deletion.
        </p>
      </LegalSection>

      <LegalSection number="06." title="Security">
        <p>
          Passwords are stored as bcrypt hashes. Authentication uses signed JWT
          sessions. Database connections use TLS. Image storage uses presigned
          URLs scoped to your account. We have alerting in place for unusual
          activity and follow standard incident response practices.
        </p>
      </LegalSection>

      <LegalSection number="07." title="Children">
        <p>
          Recipe Vault is not directed at children under 13. If we learn we
          have collected information from a child under 13 without verifiable
          parental consent, we will delete it.
        </p>
      </LegalSection>

      <LegalSection number="08." title="Changes">
        <p>
          If we make material changes to this policy, we will email registered
          users and post the updated version here at least 7 days before it
          takes effect.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
