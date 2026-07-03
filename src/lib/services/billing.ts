import { eq } from "drizzle-orm";
import { getStripe, STRIPE_PRODUCTS } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

function buildPriceToPlan(): Record<string, { planId: string; interval: string }> {
  const map: Record<string, { planId: string; interval: string }> = {};
  for (const [plan, prices] of Object.entries(STRIPE_PRODUCTS)) {
    for (const [interval, priceId] of Object.entries(prices)) {
      if (priceId) map[priceId] = { planId: plan, interval };
    }
  }
  return map;
}

const PRICE_TO_PLAN = buildPriceToPlan();

export function planForPrice(priceId?: string | null) {
  if (!priceId) return null;
  return PRICE_TO_PLAN[priceId] ?? null;
}

export async function ensureStripeCustomer(userId: string, email: string | null) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new Error("User not found");

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await getStripe().customers.create({
    email: email ?? undefined,
    metadata: { userId },
  });

  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId));

  return customer.id;
}

export async function updateSubscriptionFromStripe(input: {
  customerId: string;
  priceId?: string | null;
  status?: string | null;
  currentPeriodEnd?: number | null;
}) {
  const plan = planForPrice(input.priceId);

  // Never downgrade a paying customer to a featureless plan just because a
  // price id was not recognized (rotated env var, promo, or dashboard price).
  // Preserve the current plan and update only status/period when unmapped.
  if (!plan) {
    console.error(
      "[billing] unmapped Stripe price id, preserving current plan",
      input.priceId,
    );
  }

  await db
    .update(users)
    .set({
      stripeCustomerId: input.customerId,
      subscriptionStatus: input.status ?? "active",
      subscriptionPlatform: "stripe",
      currentPeriodEnd: input.currentPeriodEnd
        ? new Date(input.currentPeriodEnd * 1000)
        : null,
      ...(plan ? { planId: plan.planId, billingInterval: plan.interval } : {}),
    })
    .where(eq(users.stripeCustomerId, input.customerId));
}

export async function updateSubscriptionFromRevenueCat(input: {
  appUserId: string;
  planId: string;
  billingInterval: string | null;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
  platform: "apple" | "google";
}) {
  await db
    .update(users)
    .set({
      planId: input.planId,
      billingInterval: input.billingInterval,
      subscriptionStatus: input.subscriptionStatus,
      subscriptionPlatform: input.platform,
      currentPeriodEnd: input.currentPeriodEnd,
    })
    .where(eq(users.id, input.appUserId));
}
