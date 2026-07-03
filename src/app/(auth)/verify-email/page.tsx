import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="grid gap-5 text-center">
      <div
        aria-hidden="true"
        className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-paper)] text-[var(--accent-deep)]"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="13" rx="2.5" />
          <path d="M4 8l8 6 8-6" />
        </svg>
      </div>
      <header>
        <p className="eyebrow">One last step</p>
        <h1
          className="mt-2 text-[2rem] font-medium leading-[1.05]"
          style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
        >
          Check your email
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-[var(--ink-muted)]">
          Click the verification link to finish setting up your Recipe Vault
          account. The email may take a minute.
        </p>
      </header>
      <Button href="/login" variant="secondary" size="lg" fullWidth>
        Back to log in
      </Button>
      <p className="text-xs text-[var(--ink-soft)]">
        Wrong email?{" "}
        <Link href="/signup" className="font-semibold text-[var(--accent-deep)] hover:underline">
          Sign up again
        </Link>
      </p>
    </div>
  );
}
