import type { Metadata } from "next";
import { LegalShell, LegalSection } from "../legal-shell";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The rules of using Recipe Vault.",
};

export default function TermsPage() {
  return (
    <LegalShell eyebrow="Legal" title="Terms of service" updated="May 13, 2026">
      <p>
        These Terms cover your use of Recipe Vault (the &ldquo;Service&rdquo;),
        operated by Recipe Vault. By creating an account or using the apps, you
        agree to these Terms.
      </p>

      <LegalSection number="01." title="Your account">
        <p>
          You are responsible for the activity on your account and for keeping
          your password safe. Notify us promptly if you suspect unauthorized
          use.
        </p>
        <p>
          You must be at least 13 years old to use Recipe Vault, and at least
          18 (or the age of majority in your jurisdiction) to subscribe.
        </p>
      </LegalSection>

      <LegalSection number="02." title="Subscriptions and trial">
        <p>
          Every new account starts with a 3-day Pro trial. After the trial,
          your account falls back to the Free plan unless you subscribe to Pro
          or Family.
        </p>
        <p>
          Subscriptions auto-renew at the end of each billing period until
          cancelled. You can cancel from Settings &rarr; Billing (web) or in
          your device subscription settings (mobile). Cancellation takes
          effect at the end of the current billing period.
        </p>
        <p>
          Mobile subscriptions are billed by Apple or Google according to
          their respective billing terms. Refunds for mobile subscriptions are
          handled by the respective store.
        </p>
        <p>
          For web subscriptions billed through Stripe, you may request a
          refund within 14 days of purchase if you have not used Pro features
          since billing.
        </p>
      </LegalSection>

      <LegalSection number="03." title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="grid gap-1.5 list-disc pl-5">
          <li>Upload illegal content, content you do not have rights to, or content that violates third-party rights</li>
          <li>Use the Service to harass, defame, or harm others</li>
          <li>Attempt to bypass rate limits, security controls, or feature gates</li>
          <li>Resell or sublicense Service access</li>
          <li>Scrape, copy, or reverse-engineer the apps for competitive purposes</li>
        </ul>
        <p>We may suspend or terminate accounts that violate these rules.</p>
      </LegalSection>

      <LegalSection number="04." title="Your content">
        <p>
          You retain all rights to recipes, scans, and journal entries you
          create. You grant us a limited license to host, process, and display
          your content as needed to provide the Service (including running AI
          on your recipes when you use those features). We do not claim
          ownership and do not use your content to train AI models.
        </p>
        <p>
          If you make a recipe public by generating a share link, that link
          can be accessed by anyone with the URL until you unshare.
        </p>
      </LegalSection>

      <LegalSection number="05." title="AI guidance disclaimer">
        <p>
          Recipe Vault&apos;s AI cooking companion, modifications, and nutrition
          estimates are informational and may contain errors. Always use your
          own judgment, especially around food safety, allergies, and special
          dietary needs. Nutrition values are estimates and not a substitute
          for professional medical advice.
        </p>
      </LegalSection>

      <LegalSection number="06." title="Family plan">
        <p>
          The Family plan supports one admin and up to three members.
          Memberships are managed by the admin, who is responsible for
          billing. Members can be removed by the admin at any time; removed
          members lose access to the shared cookbook but keep their own
          recipes.
        </p>
      </LegalSection>

      <LegalSection number="07." title="Termination">
        <p>
          You may delete your account at any time from Settings &rarr; Account.
          We may suspend or terminate accounts for violation of these Terms,
          for fraud or chargebacks, or for prolonged inactivity (12 months on
          Free plan).
        </p>
      </LegalSection>

      <LegalSection number="08." title="Warranty disclaimer">
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of
          any kind. To the maximum extent permitted by law, we disclaim all
          implied warranties of merchantability, fitness for a particular
          purpose, and non-infringement.
        </p>
      </LegalSection>

      <LegalSection number="09." title="Limitation of liability">
        <p>
          Our total liability for any claim arising out of the Service is
          limited to the amount you paid us in the 12 months preceding the
          claim, or $50 if you have not paid us. We are not liable for
          indirect, incidental, or consequential damages.
        </p>
      </LegalSection>

      <LegalSection number="10." title="Governing law and disputes">
        <p>
          These Terms are governed by the laws of the State of Delaware, USA.
          Any dispute will be resolved in the state or federal courts located
          in Delaware, except where applicable consumer protection law
          requires otherwise.
        </p>
      </LegalSection>

      <LegalSection number="11." title="Changes">
        <p>
          We may update these Terms occasionally. If we make material changes,
          we will email registered users and post the updated version here at
          least 7 days before they take effect. Continued use after that date
          constitutes acceptance.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
