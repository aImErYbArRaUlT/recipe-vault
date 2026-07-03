import { createRemoteJWKSet, jwtVerify } from "jose";

// Verify a native iOS Apple Sign In token server-side; trusting the client would let anyone log in as any Apple ID.
const APPLE_ISSUER = "https://appleid.apple.com";
const JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

/** Bundle IDs we accept as the `aud` claim for native sign-in. */
function validAudiences(): string[] {
  const env = process.env.APPLE_NATIVE_BUNDLE_IDS ?? "com.example.recipevault";
  return env
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type AppleIdentityClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean | string;
  is_private_email?: boolean | string;
};

export async function verifyAppleIdentityToken(
  identityToken: string,
): Promise<AppleIdentityClaims> {
  const audiences = validAudiences();
  const { payload } = await jwtVerify(identityToken, JWKS, {
    issuer: APPLE_ISSUER,
    audience: audiences,
  });
  if (!payload.sub) {
    throw new Error("Apple identity token missing subject");
  }
  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    email_verified: payload.email_verified as boolean | string | undefined,
    is_private_email: payload.is_private_email as boolean | string | undefined,
  };
}
