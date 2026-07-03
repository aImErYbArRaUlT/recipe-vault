"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
      <main className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-lg rounded-[var(--radius-card-lg)] border border-[var(--rule)] bg-[var(--surface-raised)] p-8 text-center shadow-[var(--shadow-lifted)] md:p-12">
          <div
            aria-hidden="true"
            className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--oxblood-soft)] text-[var(--oxblood)]"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v4M12 17v.5" />
              <path d="M10.3 3.6L2.8 16.2a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
            </svg>
          </div>
          <p className="eyebrow mt-5">Unexpected error</p>
          <h1
            className="mt-3 text-[clamp(1.75rem,4vw,2.5rem)] font-medium leading-[1.05]"
            style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
          >
            Something went wrong{" "}
            <span
              className="italic text-[var(--accent-deep)]"
              style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 100" }}
            >
              in the kitchen
            </span>
          </h1>
          <p className="mt-4 text-base text-[var(--ink-muted)]">
            Your recipes are safe. Try the action again, or head back to your
            dashboard. We&apos;ve been notified.
          </p>
          {error.digest ? (
            <p className="mt-3 text-xs text-[var(--ink-soft)] tabular">
              Reference: {error.digest}
            </p>
          ) : null}
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Button onClick={reset} variant="primary" size="lg">
              Try again
            </Button>
            <Button href="/dashboard" variant="secondary" size="lg">
              Go to dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
