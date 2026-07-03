"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Divider } from "@/components/ui/divider";
import { GoogleMark } from "@/components/ui/icon";
import { AppleSignInButton } from "@/components/auth/apple-sign-in-button";
import { usePlatform } from "@/lib/hooks/use-platform";

export default function LoginPage() {
  const router = useRouter();
  const { isNativeIOS } = usePlatform();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow">Welcome back</p>
        <h1
          className="mt-2 text-[2rem] font-medium leading-[1.05]"
          style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
        >
          Open your vault
        </h1>
      </header>

      <div className="grid gap-3">
        <AppleSignInButton callbackUrl="/dashboard" />
        {!isNativeIOS ? (
          <Button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            variant="secondary"
            size="lg"
            fullWidth
            leading={<GoogleMark />}
          >
            Continue with Google
          </Button>
        ) : null}
      </div>

      <Divider label="Or" />

      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        <Input
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          error={error && !email ? "Email is required" : undefined}
        />
        <Input
          type={showPassword ? "text" : "password"}
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
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
          loading={loading}
          variant="primary"
          size="lg"
          fullWidth
          hapticIntensity="medium"
        >
          {loading ? "Signing in…" : "Log in"}
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          href="/forgot-password"
          className="text-[var(--ink-muted)] hover:text-[var(--accent-deep)]"
        >
          Forgot password?
        </Link>
        <Link
          href="/signup"
          className="font-semibold text-[var(--accent-deep)] hover:underline"
        >
          Create account →
        </Link>
      </div>
    </div>
  );
}
