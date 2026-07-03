"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";

const APPLE_SERVICE_ID =
  process.env.NEXT_PUBLIC_APPLE_NATIVE_SERVICE_ID ?? "com.example.recipevault";

function AppleMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.365 1.43c0 1.14-.42 2.21-1.25 3.16-1 1.15-2.21 1.81-3.51 1.7-.16-1.1.42-2.27 1.27-3.19.93-1.01 2.55-1.76 3.49-1.67zM20.5 17.4c-.55 1.25-.83 1.81-1.54 2.92-1 1.55-2.4 3.48-4.14 3.5-1.55.02-1.95-.99-4.06-.98-2.11.01-2.55.99-4.1.98-1.74-.02-3.07-1.76-4.07-3.31C.84 17.6.42 13.66 2.05 11.06c1.16-1.84 2.99-2.92 4.72-2.92 1.76 0 2.86 1.02 4.31 1.02 1.41 0 2.27-1.02 4.31-1.02 1.54 0 3.18.83 4.34 2.27-3.82 2.06-3.2 7.34.77 7.99z" />
    </svg>
  );
}

// Native Apple Sign In inside the iOS app, falling back to web OAuth elsewhere.
export function AppleSignInButton({
  callbackUrl = "/dashboard",
  fullWidth = true,
}: {
  callbackUrl?: string;
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNativeIOS =
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "ios";

  async function onClick() {
    setError(null);
    setLoading(true);
    try {
      if (isNativeIOS) {
        // Local Swift plugin via Capacitor.registerPlugin, no npm package needed.
        const { registerPlugin } = await import("@capacitor/core");
        const AppleSignIn = registerPlugin<{
          authorize(): Promise<{
            user: string;
            identityToken?: string;
            authorizationCode?: string;
            email?: string;
            givenName?: string;
            familyName?: string;
          }>;
        }>("AppleSignIn");
        const res = await AppleSignIn.authorize();
        if (!res.identityToken) {
          throw new Error("Apple did not return an identity token.");
        }
        const signInResult = await signIn("apple-native", {
          identityToken: res.identityToken,
          givenName: res.givenName ?? "",
          familyName: res.familyName ?? "",
          email: res.email ?? "",
          redirect: false,
        });
        if (signInResult?.error) {
          throw new Error("Could not finish Apple sign-in.");
        }
        router.push(callbackUrl);
        return;
      }

      // Web fallback: standard NextAuth OAuth flow.
      await signIn("apple", { callbackUrl });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Apple sign-in failed.";
      // User-cancelled iOS sheets throw a known error code; ignore quietly.
      if (
        message.toLowerCase().includes("cancel") ||
        message.toLowerCase().includes("1001")
      ) {
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-1.5">
      <Button
        onClick={onClick}
        variant="secondary"
        size="lg"
        fullWidth={fullWidth}
        loading={loading}
        leading={<AppleMark />}
        className="!bg-[var(--ink)] !text-[var(--ink-inverse)] !border-[var(--ink)] hover:!bg-[var(--ink)]/90"
      >
        Continue with Apple
      </Button>
      {error ? (
        <p className="text-xs text-[var(--oxblood)]">{error}</p>
      ) : null}
    </div>
  );
}
