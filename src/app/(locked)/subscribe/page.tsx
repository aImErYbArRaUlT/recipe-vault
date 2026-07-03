"use client";

import { isNative } from "@/lib/capacitor";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function SubscribePage() {
  const native = isNative();
  return (
    <div
      className="flex min-h-screen flex-col px-5"
      style={{
        paddingTop: "var(--safe-area-top)",
        paddingBottom: "var(--safe-area-bottom)",
      }}
    >
      <header className="flex items-center justify-between py-4">
        <Logo variant="full" className="text-base md:text-lg" />
      </header>
      <main id="main" className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-lg rounded-[var(--radius-card-lg)] border border-[var(--rule)] bg-[var(--surface-raised)] p-8 shadow-[var(--shadow-lifted)] md:p-12">
          <div
            aria-hidden="true"
            className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--mustard-soft)] text-[var(--mustard)]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7v6M12 16v.5" />
            </svg>
          </div>
          <p className="eyebrow mt-5">Subscription paused</p>
          <h1
            className="mt-3 text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.05]"
            style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
          >
            Let&apos;s get you{" "}
            <span className="italic text-[var(--accent-deep)]" style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 100" }}>
              back in the kitchen
            </span>
          </h1>
          <p className="mt-4 text-base text-[var(--ink-muted)]">
            Your subscription has lapsed. Resume it to unlock AI scanning, the
            voice cooking companion, and unlimited cookbooks. Your recipes are
            safe and waiting.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Button
              href={native ? "/settings/billing" : "/pricing"}
              variant="primary"
              size="lg"
              hapticIntensity="medium"
            >
              See plans
            </Button>
            <Button href="/settings/billing" variant="secondary" size="lg">
              Manage billing
            </Button>
          </div>
          <p className="mt-6 text-xs text-[var(--ink-soft)]">
            We keep your recipes for 60 days even without a subscription.
          </p>
        </div>
      </main>
    </div>
  );
}
