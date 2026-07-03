// Single source of truth for plan entitlements, limits, trial length, and pricing.
// Client-safe: no server-only imports, so UI can read these constants directly.

export type PlanId = "free" | "home" | "trial" | "pro" | "family";

export type Feature =
  | "ai_scanning"
  | "ai_voice_companion"
  | "ai_modifications"
  | "ai_substitutions"
  | "ai_nutrition"
  | "cook_logs"
  | "version_history"
  | "family_sharing"
  | "unlimited_cookbooks";

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Length of the full-access trial granted to every new account.
export const TRIAL_DAYS = 3;
export const TRIAL_DURATION_MS = TRIAL_DAYS * MS_PER_DAY;

// Subscription statuses that still grant paid entitlements (active plus grace).
export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "past_due"] as const;

export function isActiveSubscription(status: string | null | undefined): boolean {
  return !!status && (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
}

const AI_FEATURES: Feature[] = [
  "ai_scanning",
  "ai_voice_companion",
  "ai_modifications",
  "ai_substitutions",
  "ai_nutrition",
];

const PRO_FEATURES: Feature[] = [
  ...AI_FEATURES,
  "cook_logs",
  "version_history",
  "unlimited_cookbooks",
];

// Feature entitlements per plan: free/home get base app only, trial mirrors pro, family is pro plus sharing.
export const PLAN_FEATURES: Record<PlanId, Feature[]> = {
  free: [],
  home: [],
  trial: PRO_FEATURES,
  pro: PRO_FEATURES,
  family: [...PRO_FEATURES, "family_sharing"],
};

// Max cookbooks per plan. null means unlimited.
export const COOKBOOK_LIMITS: Record<PlanId, number | null> = {
  free: 2,
  home: 3,
  trial: null,
  pro: null,
  family: null,
};

// Combined daily AI request cap per plan across all AI endpoints.
export const DAILY_AI_LIMITS: Record<PlanId, number> = {
  free: 0,
  home: 0,
  trial: 250,
  pro: 1000,
  family: 1500,
};

// Max members in a family plan, including the admin.
export const MAX_FAMILY_MEMBERS = 4;

// Display-only prices; actual charges come from the Stripe prices in STRIPE_PRICE_* env vars.
export const PLAN_PRICING = {
  home: { monthly: "$10", annual: "$99" },
  pro: { monthly: "$15", annual: "$149" },
  family: { monthly: "$30", annual: "$299" },
} as const;
