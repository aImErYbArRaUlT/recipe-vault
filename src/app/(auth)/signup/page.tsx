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

export default function SignupPage() {
  const router = useRouter();
  const { isNativeIOS } = usePlatform();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName: name }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Signup failed. Try a different email.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      setError("Account created, but auto sign-in failed. Try logging in.");
      return;
    }

    router.push("/welcome");
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="eyebrow">Open your vault</p>
        <h1
          className="mt-2 text-[2rem] font-medium leading-[1.05]"
          style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
        >
          Free forever,{" "}
          <span className="italic text-[var(--accent-deep)]" style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 100" }}>
            with Pro on the house
          </span>{" "}
          for 3 days
        </h1>
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          Keep recipes by hand for free, with all AI features included free for
          your first three days. No card required.
        </p>
      </header>

      <div className="grid gap-3">
        <AppleSignInButton callbackUrl="/welcome" />
        {!isNativeIOS ? (
          <Button
            onClick={() => signIn("google", { callbackUrl: "/welcome" })}
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
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          placeholder="Maria Bianchi"
        />
        <Input
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
        />
        <Input
          type={showPassword ? "text" : "password"}
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use 8+ characters. Pick something memorable."
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
          {loading ? "Creating account…" : "Create my vault"}
        </Button>
        <p className="text-center text-xs text-[var(--ink-soft)]">
          By continuing, you agree to our{" "}
          <Link href="/legal/terms" className="underline-offset-2 hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="underline-offset-2 hover:underline">
            Privacy policy
          </Link>
          .
        </p>
      </form>

      <div className="text-center text-sm">
        <span className="text-[var(--ink-muted)]">Already have an account? </span>
        <Link href="/login" className="font-semibold text-[var(--accent-deep)] hover:underline">
          Log in
        </Link>
      </div>
    </div>
  );
}
