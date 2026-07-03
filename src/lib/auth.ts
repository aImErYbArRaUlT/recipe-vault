import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, accounts, verificationTokens } from "@/lib/db/schema";
import { verifyAppleIdentityToken } from "@/lib/auth/apple-native";
import { TRIAL_DURATION_MS } from "@/lib/config/plans";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Apple({
      clientId: process.env.APPLE_CLIENT_ID ?? "",
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;
          const email = credentials.email as string;
          const password = credentials.password as string;
          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
          });
          if (!user?.passwordHash) return null;
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;
          return { id: user.id, email: user.email, name: user.name };
        } catch {
          return null;
        }
      },
    }),
    /*
     * Native iOS Apple Sign In.
     *
     * The iOS app gets a signed JWT from ASAuthorizationAppleIDProvider via
     * the @capacitor-community/apple-sign-in plugin and POSTs it here. We
     * verify the signature against Apple's JWKS, then find-or-create the
     * user keyed on Apple's stable `sub` (Apple only sends name/email on
     * the FIRST sign-in, so we persist the link via the `accounts` table).
     */
    Credentials({
      id: "apple-native",
      name: "Apple (iOS native)",
      credentials: {
        identityToken: { label: "identityToken", type: "text" },
        givenName: { label: "givenName", type: "text" },
        familyName: { label: "familyName", type: "text" },
        email: { label: "email", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.identityToken) return null;
          const claims = await verifyAppleIdentityToken(
            credentials.identityToken as string,
          );

          // Look up existing account first.
          const existingLink = await db.query.accounts.findFirst({
            where: and(
              eq(accounts.provider, "apple-native"),
              eq(accounts.providerAccountId, claims.sub),
            ),
          });

          if (existingLink) {
            const linked = await db.query.users.findFirst({
              where: eq(users.id, existingLink.userId),
            });
            if (linked) {
              return {
                id: linked.id,
                email: linked.email,
                name: linked.name,
              };
            }
          }

          // First sign-in for this Apple sub. Require a verified email from the
          // token itself; never trust the client-supplied credentials.email.
          const emailVerified =
            claims.email_verified === true || claims.email_verified === "true";
          const email = claims.email;
          if (!email || !emailVerified) return null;

          // If there's already an account with this email (e.g. signed up
          // via Google before), link instead of duplicating.
          let userRow = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          if (!userRow) {
            const displayName = [
              credentials.givenName,
              credentials.familyName,
            ]
              .filter((p) => typeof p === "string" && p)
              .join(" ")
              .trim() || null;
            const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_MS);
            const [created] = await db
              .insert(users)
              .values({
                email,
                name: displayName,
                displayName,
                planId: "trial",
                subscriptionStatus: "trialing",
                trialEndsAt,
              })
              .returning();
            userRow = created;
          }

          await db.insert(accounts).values({
            userId: userRow.id,
            type: "oauth",
            provider: "apple-native",
            providerAccountId: claims.sub,
          });

          return {
            id: userRow.id,
            email: userRow.email,
            name: userRow.name,
          };
        } catch (err) {
          console.error("[apple-native] verify failed", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return !!user;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }

      const userId = token.userId as string | undefined;
      if (!userId) return token;

      const now = Date.now();
      const lastRefresh = (token.lastRefreshAt as number) ?? 0;
      if (now - lastRefresh < 60_000) return token;

      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      if (dbUser) {
        token.planId = dbUser.planId;
        token.subscriptionStatus = dbUser.subscriptionStatus;
        token.familyId = dbUser.familyId;
        token.familyRole = dbUser.familyRole;
        token.trialEndsAt = dbUser.trialEndsAt ? dbUser.trialEndsAt.toISOString() : null;
        token.lastRefreshAt = now;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.planId = token.planId as string | null;
        session.user.subscriptionStatus = token.subscriptionStatus as string | null;
        session.user.familyId = token.familyId as string | null;
        session.user.familyRole = token.familyRole as string | null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).trialEndsAt = token.trialEndsAt;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
  },
});
