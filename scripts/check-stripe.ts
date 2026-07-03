import "dotenv/config";
import { getStripe, STRIPE_PRODUCTS } from "@/lib/stripe";

type Expected = {
  amountCents: number;
  interval: "month" | "year";
  label: string;
};

const EXPECTED: Record<string, Expected> = {
  STRIPE_PRICE_HOME_MONTHLY: {
    amountCents: 1000,
    interval: "month",
    label: "Home $10/mo (legacy)",
  },
  STRIPE_PRICE_HOME_ANNUAL: {
    amountCents: 9900,
    interval: "year",
    label: "Home $99/yr (legacy)",
  },
  STRIPE_PRICE_PRO_MONTHLY: {
    amountCents: 1500,
    interval: "month",
    label: "Pro $15/mo",
  },
  STRIPE_PRICE_PRO_ANNUAL: {
    amountCents: 14900,
    interval: "year",
    label: "Pro $149/yr",
  },
  STRIPE_PRICE_FAMILY_MONTHLY: {
    amountCents: 3000,
    interval: "month",
    label: "Family $30/mo",
  },
  STRIPE_PRICE_FAMILY_ANNUAL: {
    amountCents: 29900,
    interval: "year",
    label: "Family $299/yr",
  },
};

async function main() {
  const stripe = getStripe();
  const key = process.env.STRIPE_SECRET_KEY!;
  const mode = key.startsWith("sk_live")
    ? "LIVE"
    : key.startsWith("sk_test")
      ? "TEST"
      : "?";
  console.log(`[stripe] mode: ${mode}`);

  // Confirm the account ping works.
  try {
    const account = await stripe.accounts.retrieve();
    console.log(
      `[stripe] account: ${account.id} (${account.email ?? "no email"})`,
    );
  } catch (err) {
    console.error("[stripe] account ping FAILED:", (err as Error).message);
    process.exit(1);
  }

  let problems = 0;
  for (const [envVar, expected] of Object.entries(EXPECTED)) {
    const priceId = process.env[envVar];
    if (!priceId) {
      console.error(`  ✗ ${envVar}: not set`);
      problems++;
      continue;
    }
    try {
      const price = await stripe.prices.retrieve(priceId, {
        expand: ["product"],
      });
      const product = price.product as { name?: string } | string;
      const productName = typeof product === "string" ? product : product.name;
      const amount = price.unit_amount;
      const interval = price.recurring?.interval;
      const ok =
        amount === expected.amountCents && interval === expected.interval;
      const mark = ok ? "✓" : "✗";
      console.log(
        `  ${mark} ${envVar}  ${priceId}  ${productName}  $${(amount ?? 0) / 100}/${interval}`,
      );
      if (!ok) {
        console.log(
          `      expected $${expected.amountCents / 100}/${expected.interval}, ${expected.label}`,
        );
        problems++;
      }
    } catch (err) {
      console.error(
        `  ✗ ${envVar}=${priceId}: ${(err as Error).message}`,
      );
      problems++;
    }
  }

  // Mapping sanity check
  const ids = Object.values(STRIPE_PRODUCTS).flatMap((p) =>
    Object.values(p).filter(Boolean),
  );
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    console.error("[stripe] duplicate price IDs detected in STRIPE_PRODUCTS map");
    problems++;
  }

  // Webhook secret
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn(
      "[stripe] STRIPE_WEBHOOK_SECRET not set; the webhook handler will reject events.",
    );
  } else {
    console.log("[stripe] webhook secret: set");
  }

  if (problems === 0) {
    console.log("\n[stripe] All 6 prices verified. Ready to charge.");
  } else {
    console.log(`\n[stripe] ${problems} problem(s). Fix before launch.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
