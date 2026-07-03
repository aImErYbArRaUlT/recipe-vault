"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      setError("Something went wrong. Try again.");
      setStatus("idle");
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow">Forgot password</p>
        <h1
          className="mt-2 text-[2rem] font-medium leading-[1.05]"
          style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
        >
          Reset your password
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          We&apos;ll email you a link to set a new password.
        </p>
      </header>

      {status === "sent" ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--moss)]/30 bg-[var(--moss-soft)] p-5">
          <p className="eyebrow text-[var(--moss)]">Check your inbox</p>
          <p className="mt-2 text-sm text-[var(--ink)]">
            If <span className="font-semibold">{email}</span> is registered, a reset link is on its way.
          </p>
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
            placeholder="you@example.com"
            error={error || undefined}
          />
          <Button
            type="submit"
            loading={status === "loading"}
            variant="primary"
            size="lg"
            fullWidth
          >
            {status === "loading" ? "Sending…" : "Send reset link"}
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
