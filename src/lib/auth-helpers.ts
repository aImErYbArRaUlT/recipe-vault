import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

// Fields safe to send to the browser. Excludes the password hash and the
// billing provider ids (stripeCustomerId, revenuecatCustomerId).
export function toClientUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.name,
    displayName: user.displayName,
    image: user.image,
    skillLevel: user.skillLevel,
    dietaryRestrictions: user.dietaryRestrictions,
    measurementSystem: user.measurementSystem,
    defaultServings: user.defaultServings,
    voiceEnabled: user.voiceEnabled,
    planId: user.planId,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionPlatform: user.subscriptionPlatform,
    billingInterval: user.billingInterval,
    trialEndsAt: user.trialEndsAt,
    currentPeriodEnd: user.currentPeriodEnd,
    familyId: user.familyId,
    familyRole: user.familyRole,
    onboardingComplete: user.onboardingComplete,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  return user ?? null;
}

export async function requireAuth() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}
