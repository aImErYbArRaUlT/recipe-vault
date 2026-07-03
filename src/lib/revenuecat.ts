const ENTITLEMENT_TO_PLAN: Record<string, string> = {
  home_access: "home",
  pro_access: "pro",
  family_access: "family",
};

const PRODUCT_TO_INTERVAL: Record<string, string> = {
  rv_home_monthly: "monthly",
  rv_home_annual: "annual",
  rv_pro_monthly: "monthly",
  rv_pro_annual: "annual",
  rv_family_monthly: "monthly",
  rv_family_annual: "annual",
};

const EVENT_STATUS_MAP: Record<string, string> = {
  INITIAL_PURCHASE: "active",
  RENEWAL: "active",
  UNCANCELLATION: "active",
  PRODUCT_CHANGE: "active",
  BILLING_ISSUE_DETECTED: "past_due",
  CANCELLATION: "canceled",
  EXPIRATION: "canceled",
};

export type RevenueCatWebhookEvent = {
  type: string;
  app_user_id: string;
  entitlement_ids?: string[];
  product_id?: string;
  expiration_at_ms?: number;
  store?: string;
};

export type MappedSubscription = {
  appUserId: string;
  planId: string;
  billingInterval: string | null;
  subscriptionStatus: string;
  currentPeriodEnd: Date | null;
  platform: "apple" | "google";
};

export function mapRevenueCatEvent(
  event: RevenueCatWebhookEvent,
): MappedSubscription | null {
  const status = EVENT_STATUS_MAP[event.type];
  if (!status) return null;

  const entitlementId = event.entitlement_ids?.[0];
  const planId = entitlementId ? ENTITLEMENT_TO_PLAN[entitlementId] : null;
  if (!planId) return null;

  const interval = event.product_id
    ? PRODUCT_TO_INTERVAL[event.product_id] ?? null
    : null;

  const platform = event.store === "PLAY_STORE" ? "google" : "apple";

  return {
    appUserId: event.app_user_id,
    planId,
    billingInterval: interval,
    subscriptionStatus: status,
    currentPeriodEnd: event.expiration_at_ms
      ? new Date(event.expiration_at_ms)
      : null,
    platform,
  };
}

export function validateWebhookAuth(authHeader: string | null): boolean {
  const secret = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}` || authHeader === secret;
}
