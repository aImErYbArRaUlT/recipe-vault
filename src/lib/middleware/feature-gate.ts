import type { User } from "@/lib/db/schema";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import {
  PLAN_FEATURES,
  COOKBOOK_LIMITS,
  isActiveSubscription,
  type Feature,
  type PlanId,
} from "@/lib/config/plans";

// Re-export the plan-data surface used by existing server-side callers.
export { COOKBOOK_LIMITS } from "@/lib/config/plans";
export type { Feature } from "@/lib/config/plans";

function featuresFor(planId: string | null | undefined): Feature[] {
  return PLAN_FEATURES[(planId ?? "free") as PlanId] ?? [];
}

export function hasFeature(user: User, feature: Feature): boolean {
  // Trial grants full pro access until it expires, before the cron flips it.
  if (user.planId === "trial") {
    const expired = !!user.trialEndsAt && new Date() > new Date(user.trialEndsAt);
    return featuresFor(expired ? "free" : "trial").includes(feature);
  }

  // Free and home need no subscription; read their feature list directly.
  if (user.planId === "free" || user.planId === "home") {
    return featuresFor(user.planId).includes(feature);
  }

  // Paid plans require an active or grace-period subscription.
  if (!isActiveSubscription(user.subscriptionStatus)) {
    return featuresFor("free").includes(feature);
  }

  return featuresFor(user.planId).includes(feature);
}

export function requireFeature(feature: Feature) {
  return async () => {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasFeature(user, feature)) {
      return Response.json(
        {
          error: "Feature not available on your plan",
          feature,
          current_plan: user.planId,
          upgrade_url: "/settings/billing",
        },
        { status: 403 },
      );
    }

    return null;
  };
}

export function canCreateCookbook(user: User, currentCount: number): boolean {
  const planId = (user.planId ?? "free") as keyof typeof COOKBOOK_LIMITS;
  const limit = COOKBOOK_LIMITS[planId];
  if (limit === null || limit === undefined) return true;
  return currentCount < limit;
}
