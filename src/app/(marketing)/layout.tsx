import Link from "next/link";
import MarketingFooter from "./footer";
import { Logo } from "@/components/logo";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen flex-col text-[var(--ink)]"
      style={{ paddingTop: "var(--safe-area-top)" }}
    >
      <header className="sticky top-0 z-40 border-b border-[var(--rule)] bg-[var(--paper)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:px-8">
          <Link
            href="/"
            className="flex items-center text-[var(--ink)] transition-opacity hover:opacity-80"
            aria-label="Recipe Vault, home"
          >
            <Logo variant="full" className="text-base md:text-lg" />
          </Link>
          <nav className="flex items-center gap-2 text-sm md:gap-4">
            <Link
              href="/pricing"
              className="hidden rounded-full px-4 py-2 text-[var(--ink-muted)] transition-colors hover:bg-[var(--accent-paper)] hover:text-[var(--accent-deep)] md:inline-block"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-[var(--rule)] bg-[var(--surface-raised)] px-4 py-2 text-[var(--ink)] shadow-[var(--shadow-emboss)] transition-colors hover:border-[var(--rule-strong)]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="hidden rounded-full bg-[var(--accent)] px-4 py-2 font-semibold text-white shadow-[var(--shadow-raised)] transition-colors hover:bg-[var(--accent-deep)] md:inline-block"
            >
              Start trial
            </Link>
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 md:px-8 md:py-20">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
