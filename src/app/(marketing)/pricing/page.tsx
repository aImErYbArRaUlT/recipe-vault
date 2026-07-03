import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_PRICING, TRIAL_DAYS } from "@/lib/config/plans";

type Plan = {
  name: string;
  tag: string;
  priceMonth: string;
  priceYear: string | null;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    tag: "The basics, on the house",
    priceMonth: "$0",
    priceYear: null,
    description: "Type recipes by hand, organize them, share them. No card required.",
    features: [
      "Unlimited manual recipes",
      "Up to 2 cookbooks",
      "Original scan storage",
      "Public share links",
      "Offline cache",
    ],
    cta: "Start free",
  },
  {
    name: "Pro",
    tag: "The AI kitchen",
    priceMonth: PLAN_PRICING.pro.monthly,
    priceYear: `${PLAN_PRICING.pro.annual} / yr`,
    description: "Everything in Free plus the full AI cooking suite.",
    features: [
      "AI recipe scanning",
      "Hands-free voice companion",
      "Recipe modifications and substitutions",
      "Nutrition estimates",
      "Cooking journal and version history",
      "Unlimited cookbooks",
    ],
    cta: `Try Pro free for ${TRIAL_DAYS} days`,
    popular: true,
  },
  {
    name: "Family",
    tag: "Up to 4 people",
    priceMonth: PLAN_PRICING.family.monthly,
    priceYear: `${PLAN_PRICING.family.annual} / yr`,
    description: "Everything in Pro, for the whole household.",
    features: [
      "All Pro features for 4 members",
      "Shared family cookbook",
      "Invite up to 3 family members",
      "Admin controls and billing",
    ],
    cta: "Start a family kitchen",
  },
];

function Check() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-paper)] text-[var(--accent-deep)]"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5 9-11" />
      </svg>
    </span>
  );
}

export default function PricingPage() {
  return (
    <div className="grid gap-14">
      <header className="reveal reveal-1 mx-auto max-w-2xl text-center">
        <p className="eyebrow">Pricing</p>
        <h1
          className="mt-4 text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.02em]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
        >
          Start free.{" "}
          <span className="italic text-[var(--accent-deep)]" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100" }}>
            Cook with AI
          </span>{" "}
          when you want.
        </h1>
        <p className="mt-5 text-base text-[var(--ink-muted)] md:text-lg">
          Recipe Vault is free forever for keeping recipes by hand. Pro unlocks
          AI scanning, voice cooking, and modifications. Cancel any time.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3 md:items-start md:gap-6">
        {plans.map((plan, i) => {
          const isPopular = plan.popular;
          const isFree = plan.priceMonth === "$0";
          return (
            <div
              key={plan.name}
              className={`reveal reveal-${i + 2} relative flex h-full flex-col gap-5 rounded-[var(--radius-card-lg)] border p-7 ${
                isPopular
                  ? "border-[var(--accent)] bg-[var(--surface-raised)] shadow-[var(--shadow-lifted)] md:scale-[1.03]"
                  : "border-[var(--rule)] bg-[var(--surface)] shadow-[var(--shadow-emboss)]"
              }`}
            >
              {isPopular ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge tone="accent" dot>
                    Most chosen
                  </Badge>
                </div>
              ) : null}

              <header className="grid gap-1">
                <p className="eyebrow-muted">{plan.tag}</p>
                <h2
                  className="text-3xl font-medium leading-tight"
                  style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 56, 'SOFT' 50" }}
                >
                  {plan.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">{plan.description}</p>
              </header>

              <div className="flex items-baseline gap-2">
                <span
                  className="text-[2.5rem] font-medium leading-none tabular"
                  style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 96, 'SOFT' 30" }}
                >
                  {plan.priceMonth}
                </span>
                {!isFree ? <span className="text-sm text-[var(--ink-soft)]">/ month</span> : null}
              </div>
              {plan.priceYear ? (
                <p className="-mt-3 text-xs text-[var(--ink-soft)]">
                  or {plan.priceYear} · save 17%
                </p>
              ) : (
                <p className="-mt-3 text-xs text-[var(--ink-soft)]">
                  Forever. No card on file.
                </p>
              )}

              <ul className="grid gap-2.5 text-sm text-[var(--ink-muted)]">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-3">
                <Button
                  href="/signup"
                  size="lg"
                  fullWidth
                  variant={isPopular ? "primary" : "secondary"}
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          );
        })}
      </section>

      <footer className="mx-auto max-w-2xl text-center text-sm text-[var(--ink-soft)]">
        All plans include preservation of original scans, cloud sync across
        devices, and our kitchen guarantee: cancel any time and we keep your
        recipes safely for 60 days while you decide.
      </footer>
    </div>
  );
}
