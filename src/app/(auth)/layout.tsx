import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen flex-col px-5"
      style={{
        paddingTop: "var(--safe-area-top)",
        paddingBottom: "var(--safe-area-bottom)",
        paddingLeft: "max(1.25rem, var(--safe-area-left))",
        paddingRight: "max(1.25rem, var(--safe-area-right))",
      }}
    >
      <header className="flex items-center justify-between py-4">
        <Link
          href="/"
          aria-label="Recipe Vault home"
          className="inline-flex items-center"
        >
          <Logo variant="full" className="text-base md:text-lg" />
        </Link>
      </header>
      <main id="main" className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-md">
          <div className="rounded-[var(--radius-card-lg)] border border-[var(--rule)] bg-[var(--surface-raised)] p-7 shadow-[var(--shadow-raised)] md:p-9">
            {children}
          </div>
          <p className="mt-6 text-center text-xs italic text-[var(--ink-soft)]">
            For the recipes too good to be lost in a drawer.
          </p>
        </div>
      </main>
    </div>
  );
}
