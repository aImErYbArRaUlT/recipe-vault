import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2026-01-28.clover" });
  }
  return _stripe;
}

export const STRIPE_PRODUCTS = {
  home: {
    monthly: process.env.STRIPE_PRICE_HOME_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_HOME_ANNUAL ?? "",
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "",
  },
  family: {
    monthly: process.env.STRIPE_PRICE_FAMILY_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_FAMILY_ANNUAL ?? "",
  },
};
