import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { STRIPE_PRODUCTS, getStripe } from "@/lib/stripe";
import { ensureStripeCustomer } from "@/lib/services/billing";

const schema = z.object({
  plan: z.enum(["home", "pro", "family"]),
  interval: z.enum(["monthly", "annual"]),
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const priceId = STRIPE_PRODUCTS[parsed.data.plan][parsed.data.interval];
  if (!priceId) {
    return Response.json({ error: "Plan not available" }, { status: 503 });
  }

  const customerId = await ensureStripeCustomer(user.id, user.email);

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/settings/billing?canceled=true`,
  });

  return Response.json({ url: session.url });
});
