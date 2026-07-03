import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      planId: string | null;
      subscriptionStatus: string | null;
      familyId: string | null;
      familyRole: string | null;
      trialEndsAt: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    planId?: string | null;
    subscriptionStatus?: string | null;
    familyId?: string | null;
    familyRole?: string | null;
    trialEndsAt?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    planId?: string | null;
    subscriptionStatus?: string | null;
    familyId?: string | null;
    familyRole?: string | null;
    trialEndsAt?: string | null;
  }
}
