// Idempotently create the Stripe product catalog and print env vars for Railway.

import "dotenv/config";
import Stripe from "stripe";

type PlanConfig = {
  key: "home" | "pro" | "family";
  name: string;
  description: string;
  monthlyAmountCents: number;
  annualAmountCents: number;
};

const PLANS: PlanConfig[] = [
  {
    key: "home",
    name: "Recipe Vault Home",
    description:
      "Manual recipes, 3 cookbooks, offline cache. Legacy tier (no longer offered to new signups).",
    monthlyAmountCents: 1000,
    annualAmountCents: 9900,
  },
  {
    key: "pro",
    name: "Recipe Vault Pro",
    description:
      "Full AI suite: scanning, voice cooking, modifications, nutrition, cook logs, unlimited cookbooks.",
    monthlyAmountCents: 1500,
    annualAmountCents: 14900,
  },
  {
    key: "family",
    name: "Recipe Vault Family",
    description:
      "Recipe Vault Pro for up to 4 family members plus a shared family cookbook.",
    monthlyAmountCents: 3000,
    annualAmountCents: 29900,
  },
];

async function findProductByName(stripe: Stripe, name: string) {
  for await (const product of stripe.products.list({ active: true, limit: 100 })) {
    if (product.name === name) return product;
  }
  return null;
}

async function findMatchingPrice(
  stripe: Stripe,
  productId: string,
  amount: number,
  interval: "month" | "year",
) {
  for await (const price of stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  })) {
    if (
      price.unit_amount === amount &&
      price.recurring?.interval === interval &&
      price.currency === "usd"
    ) {
      return price;
    }
  }
  return null;
}

async function ensureProduct(
  stripe: Stripe,
  plan: PlanConfig,
  dryRun: boolean,
) {
  const existing = await findProductByName(stripe, plan.name);
  if (existing) {
    console.log(`  · ${plan.key}: product exists (${existing.id})`);
    return existing;
  }
  if (dryRun) {
    console.log(`  · ${plan.key}: would create product "${plan.name}"`);
    return { id: "prod_DRYRUN" } as Stripe.Product;
  }
  const created = await stripe.products.create({
    name: plan.name,
    description: plan.description,
  });
  console.log(`  ✓ ${plan.key}: created product ${created.id}`);
  return created;
}

async function ensurePrice(
  stripe: Stripe,
  productId: string,
  amount: number,
  interval: "month" | "year",
  dryRun: boolean,
) {
  if (productId === "prod_DRYRUN") return "price_DRYRUN";
  const existing = await findMatchingPrice(stripe, productId, amount, interval);
  if (existing) {
    console.log(
      `      reuses $${amount / 100}/${interval} -> ${existing.id}`,
    );
    return existing.id;
  }
  if (dryRun) {
    console.log(`      would create $${amount / 100}/${interval}`);
    return "price_DRYRUN";
  }
  const created = await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: "usd",
    recurring: { interval },
  });
  console.log(`      created $${amount / 100}/${interval} -> ${created.id}`);
  return created.id;
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("STRIPE_SECRET_KEY is not set.");
    process.exit(1);
  }
  const dryRun = process.argv.includes("--dry-run");
  const allowTest = process.argv.includes("--allow-test");
  const isLive = key.startsWith("sk_live");

  if (!isLive && !allowTest) {
    console.error(
      "Refusing to run: STRIPE_SECRET_KEY is not a live key. Pass --allow-test to override (use this only when intentionally setting up a clean test account).",
    );
    process.exit(1);
  }

  const stripe = new Stripe(key, { apiVersion: "2026-01-28.clover" });

  console.log(`[setup-live] mode: ${isLive ? "LIVE" : "TEST"}${dryRun ? " (dry run)" : ""}`);
  const account = await stripe.accounts.retrieve();
  console.log(`[setup-live] account: ${account.id} (${account.email ?? "no email"})`);

  const envBlock: string[] = [];

  for (const plan of PLANS) {
    console.log(`\n[${plan.key}]`);
    const product = await ensureProduct(stripe, plan, dryRun);
    const monthly = await ensurePrice(
      stripe,
      product.id,
      plan.monthlyAmountCents,
      "month",
      dryRun,
    );
    const annual = await ensurePrice(
      stripe,
      product.id,
      plan.annualAmountCents,
      "year",
      dryRun,
    );
    const upper = plan.key.toUpperCase();
    envBlock.push(`STRIPE_PRICE_${upper}_MONTHLY=${monthly}`);
    envBlock.push(`STRIPE_PRICE_${upper}_ANNUAL=${annual}`);
  }

  console.log("\n[setup-live] Done.");
  console.log("\n--- Paste these into Railway's simmer-app variables (live values) ---");
  console.log(envBlock.join("\n"));
  console.log("---");
  console.log(
    "\nNext, in the Stripe Dashboard (LIVE mode):",
  );
  console.log("  1. Developers -> Webhooks -> Add endpoint");
  console.log(
    "     URL: https://<your-prod-domain>/api/stripe/webhooks",
  );
  console.log(
    "     Events: checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted",
  );
  console.log(
    "     Copy the signing secret into STRIPE_WEBHOOK_SECRET on Railway.",
  );
  console.log(
    "  2. Settings -> Customer portal: enable subscription cancellation, plan switching, payment method updates.",
  );
  console.log(
    "  3. Settings -> Branding: upload the Recipe Vault icon + set the brand color (#c35a38).",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
