import { withAuth } from "@/lib/middleware/with-auth";

export const GET = withAuth(async (_req, user) => {
  return Response.json({
    planId: user.planId,
    subscriptionStatus: user.subscriptionStatus,
    billingInterval: user.billingInterval,
    trialEndsAt: user.trialEndsAt,
    currentPeriodEnd: user.currentPeriodEnd,
  });
});
