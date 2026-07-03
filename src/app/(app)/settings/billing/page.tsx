"use client";

import { useState } from "react";
import { useUserStore } from "@/lib/stores/user";
import { usePurchase } from "@/lib/hooks/use-purchase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-shell";
import { cn } from "@/components/ui/cn";
import { PLAN_PRICING } from "@/lib/config/plans";

type Plan = {
  id: "pro" | "family";
  name: string;
  tag: string;
  monthly: string;
  annual: string;
  features: readonly string[];
  popular?: boolean;
};

const plans: readonly Plan[] = [
  {
    id: "pro",
    name: "Pro",
    tag: "AI suite",
    monthly: PLAN_PRICING.pro.monthly,
    annual: PLAN_PRICING.pro.annual,
    features: [
      "AI scanning",
      "Voice cooking companion",
      "Modifications & substitutions",
      "Cook logs & version history",
      "Unlimited cookbooks",
    ],
    popular: true,
  },
  {
    id: "family",
    name: "Family",
    tag: "Up to 4 people",
    monthly: PLAN_PRICING.family.monthly,
    annual: PLAN_PRICING.family.annual,
    features: ["All Pro features", "Shared family cookbook", "4 members", "Admin controls"],
  },
];

export default function BillingPage() {
  const storeUser = useUserStore((s) => s.user);
  const { purchase, restore, manageSubscription, platform } = usePurchase();

  const user = storeUser
    ? {
        planId: storeUser.planId ?? null,
        subscriptionStatus: storeUser.subscriptionStatus ?? null,
        subscriptionPlatform: storeUser.subscriptionPlatform ?? null,
        trialEndsAt: storeUser.trialEndsAt ?? null,
      }
    : null;

  const [plan, setPlan] = useState<"pro" | "family">("pro");
  const [interval, setInterval] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isNative = platform === "ios" || platform === "android";
  const hasActiveSubscription =
    user?.subscriptionStatus === "active" || user?.subscriptionStatus === "past_due";
  const subscribedViaDifferentPlatform =
    isNative && hasActiveSubscription && user?.subscriptionPlatform === "stripe";
  const subscribedViaStore =
    hasActiveSubscription &&
    (user?.subscriptionPlatform === "apple" || user?.subscriptionPlatform === "google");

  async function handlePurchase() {
    setError("");
    setLoading(true);
    const result = await purchase(plan, interval);
    if (!result.success && result.error !== "cancelled") {
      setError(result.error ?? "Purchase failed.");
    }
    setLoading(false);
  }

  async function handleManage() {
    setError("");
    setLoading(true);
    await manageSubscription();
    setLoading(false);
  }

  async function handleRestore() {
    setError("");
    setLoading(true);
    const result = await restore();
    if (!result.success) setError("No purchases to restore.");
    setLoading(false);
  }

  const trialEnd = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const planDisplay = user?.planId
    ? user.planId.charAt(0).toUpperCase() + user.planId.slice(1)
    : "Trial";
  const platformLabel =
    user?.subscriptionPlatform === "apple"
      ? "App Store"
      : user?.subscriptionPlatform === "google"
        ? "Google Play"
        : user?.subscriptionPlatform === "stripe"
          ? "Web"
          : null;

  return (
    <div className="grid gap-7">
      <PageHeader eyebrow="Settings" title="Billing" />

      {/* Current state */}
      <Card tone="raised" padding="lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Your plan</p>
            <p
              className="mt-2 text-3xl font-medium leading-tight"
              style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 56" }}
            >
              {planDisplay}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {hasActiveSubscription ? (
                <Badge tone="moss" dot>
                  Active
                </Badge>
              ) : user?.planId === "trial" ? (
                <Badge tone="mustard" dot>
                  Trial
                </Badge>
              ) : (
                <Badge tone="oxblood" dot>
                  {user?.subscriptionStatus ?? "Inactive"}
                </Badge>
              )}
              {platformLabel ? <Badge tone="neutral">via {platformLabel}</Badge> : null}
            </div>
            {trialEnd && user?.planId === "trial"
              ? (() => {
                  const daysLeft = Math.max(
                    0,
                    Math.ceil(
                      (trialEnd.getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24),
                    ),
                  );
                  return (
                    <p className="mt-3 text-sm text-[var(--ink-muted)]">
                      <span className="font-semibold text-[var(--ink)] tabular">
                        {daysLeft === 0
                          ? "Trial ends today"
                          : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} of Pro left`}
                      </span>{" "}
                      ·{" "}
                      <span className="tabular">
                        ends{" "}
                        {trialEnd.toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </p>
                  );
                })()
              : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {hasActiveSubscription ? (
              <Button onClick={handleManage} disabled={loading} variant="secondary" size="md">
                Manage
              </Button>
            ) : null}
            {isNative ? (
              <Button onClick={handleRestore} disabled={loading} variant="ghost" size="md">
                Restore purchases
              </Button>
            ) : null}
          </div>
        </div>
        {subscribedViaDifferentPlatform ? (
          <p className="mt-5 rounded-[var(--radius-input)] bg-[var(--mustard-soft)] px-4 py-3 text-sm text-[var(--mustard)]">
            Your subscription is managed on the web. Visit the website to make changes.
          </p>
        ) : null}
      </Card>

      {/* Plan selection (skip if already subscribed via store) */}
      {!subscribedViaDifferentPlatform && !subscribedViaStore ? (
        <Card tone="base" padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow">Choose a plan</p>
            <div className="inline-flex rounded-full border border-[var(--rule)] bg-[var(--paper)] p-1 text-xs font-semibold">
              {(["monthly", "annual"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setInterval(opt)}
                  className={cn(
                    "rounded-full px-4 py-1.5 capitalize transition-colors",
                    interval === opt
                      ? "bg-[var(--ink)] text-[var(--ink-inverse)]"
                      : "text-[var(--ink-muted)]",
                  )}
                >
                  {opt}
                  {opt === "annual" ? (
                    <span className="ml-1 text-[10px] text-[var(--accent-deep)]">−17%</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {plans.map((item) => {
              const selected = plan === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlan(item.id)}
                  aria-pressed={selected}
                  className={cn(
                    "group relative flex flex-col gap-3 rounded-[var(--radius-card)] border p-5 text-left transition-all",
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent-paper)] shadow-[var(--shadow-raised)]"
                      : "border-[var(--rule)] bg-[var(--surface)] hover:border-[var(--rule-strong)]",
                  )}
                >
                  {item.popular ? (
                    <div className="absolute -top-2 right-3">
                      <Badge tone="accent">Most chosen</Badge>
                    </div>
                  ) : null}
                  <div>
                    <p className="eyebrow-muted">{item.tag}</p>
                    <p
                      className="mt-1 text-xl font-medium leading-tight"
                      style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 36" }}
                    >
                      {item.name}
                    </p>
                  </div>
                  <p className="flex items-baseline gap-1">
                    <span
                      className="tabular text-3xl font-medium"
                      style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 56" }}
                    >
                      {interval === "monthly" ? item.monthly : item.annual}
                    </span>
                    <span className="text-xs text-[var(--ink-soft)]">/{interval === "monthly" ? "mo" : "yr"}</span>
                  </p>
                  <ul className="grid gap-1.5 text-sm text-[var(--ink-muted)]">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span
                          className="mt-1.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent)]"
                          aria-hidden="true"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3">
            <Button
              onClick={handlePurchase}
              disabled={loading}
              loading={loading}
              variant="primary"
              size="lg"
              fullWidth
              hapticIntensity="success"
            >
              {loading ? "Processing…" : `Subscribe to ${plans.find((p) => p.id === plan)!.name}`}
            </Button>
            {isNative ? (
              <p className="text-center text-xs text-[var(--ink-soft)]">
                Charged to your {platform === "ios" ? "Apple" : "Google"} account. Auto-renews
                unless cancelled 24h before period end. Manage in device Settings.
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-input)] border border-[var(--oxblood)]/30 bg-[var(--oxblood-soft)]/40 px-4 py-3 text-sm font-medium text-[var(--oxblood)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
