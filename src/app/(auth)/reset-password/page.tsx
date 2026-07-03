"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-12 w-full !rounded-full" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const initialEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Reset failed. Try again.");
      setStatus("idle");
      return;
    }

    setStatus("done");
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow">Reset password</p>
        <h1
          className="mt-2 text-[2rem] font-medium leading-[1.05]"
          style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
        >
          Choose a new password
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">At least 8 characters.</p>
      </header>

      {status === "done" ? (
        <div className="grid gap-4">
          <div className="rounded-[var(--radius-card)] border border-[var(--moss)]/30 bg-[var(--moss-soft)] p-5">
            <p className="eyebrow text-[var(--moss)]">Password updated</p>
            <p className="mt-2 text-sm text-[var(--ink)]">You can now log in with your new password.</p>
          </div>
          <Button href="/login" variant="primary" size="lg" fullWidth>
            Go to log in
          </Button>
        </div>
      ) : (
        <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
          />
          <Input
            type={showPassword ? "text" : "password"}
            label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={error || undefined}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)] hover:text-[var(--accent-deep)]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            }
          />
          <Button
            type="submit"
            loading={status === "loading"}
            variant="primary"
            size="lg"
            fullWidth
          >
            {status === "loading" ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}

      <div className="text-center text-sm">
        <Link href="/login" className="text-[var(--ink-muted)] hover:text-[var(--accent-deep)]">
          ← Back to log in
        </Link>
      </div>
    </div>
  );
}
