"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";

export default function MarketingFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--rule)] bg-[var(--paper)]/60">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo variant="full" className="text-lg" />
            <p className="mt-3 max-w-xs text-sm text-[var(--ink-muted)]">
              A living digital cookbook for the recipes that matter. Built so
              they outlast the index cards.
            </p>
          </div>
          <div>
            <p className="eyebrow-muted mb-3">Product</p>
            <ul className="grid gap-2 text-sm">
              <li>
                <Link href="/pricing" className="text-[var(--ink-muted)] hover:text-[var(--accent-deep)]">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-[var(--ink-muted)] hover:text-[var(--accent-deep)]">
                  Get started
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-[var(--ink-muted)] hover:text-[var(--accent-deep)]">
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-[var(--ink-muted)] hover:text-[var(--accent-deep)]"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="text-[var(--ink-muted)] hover:text-[var(--accent-deep)]"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="eyebrow-muted mb-3">Company</p>
            <ul className="grid gap-2 text-sm">
              <li className="text-[var(--ink-muted)]">© {new Date().getFullYear()} Recipe Vault</li>
            </ul>
          </div>
        </div>
        <div className="ink-divider mt-10" />
        <p className="mt-5 text-center text-xs italic text-[var(--ink-soft)]">
          Made for the recipes too good to be lost in a drawer.
        </p>
      </div>
    </footer>
  );
}
