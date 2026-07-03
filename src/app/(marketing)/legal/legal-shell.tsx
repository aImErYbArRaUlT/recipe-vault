import * as React from "react";
import Link from "next/link";

export function LegalShell({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-10">
      <header className="reveal reveal-1 max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1
          className="mt-3 text-[clamp(2rem,4.5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
        >
          {title}
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">Last updated {updated}</p>
      </header>

      <div
        className="reveal reveal-2 grid gap-6 text-base leading-[1.7] text-[var(--ink-muted)]"
        style={{ fontFeatureSettings: "'ss01' on" }}
      >
        {children}
      </div>

      <div className="ink-divider" />
      <p className="text-xs text-[var(--ink-soft)]">
        Questions? Open an issue on GitHub.{" "}
        <Link href="/" className="ml-2 text-[var(--accent-deep)] hover:underline">
          ← Back home
        </Link>
      </p>
    </div>
  );
}

export function LegalSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <h2 className="flex items-baseline gap-3 text-xl font-medium leading-tight text-[var(--ink)]">
        <span className="eyebrow tabular text-[var(--accent-deep)]">{number}</span>
        <span style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 36, 'SOFT' 50" }}>
          {title}
        </span>
      </h2>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}
