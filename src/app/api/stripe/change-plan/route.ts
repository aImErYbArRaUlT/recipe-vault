import { z } from "zod";
import { withAuth } from "@/lib/middleware/with-auth";
import { STRIPE_PRODUCTS, getStripe } from "@/lib/stripe";

const schema = z.object({
  subscriptionId: z.string().min(1),
  plan: z.enum(["home", "pro", "family"]),
  interval: z.enum(["monthly", "annual"]),
});

export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!user.stripeCustomerId) {
    return Response.json({ error: "No subscription to change" }, { status: 400 });
  }

  const priceId = STRIPE_PRODUCTS[parsed.data.plan][parsed.data.interval];
  if (!priceId) {
    return Response.json({ error: "Unknown plan price" }, { status: 400 });
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(
    parsed.data.subscriptionId,
  );

  // Ownership check: the subscription must belong to this user's customer.
  const ownerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;
  if (ownerId !== user.stripeCustomerId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const itemId = subscription.items.data[0]?.id;
  if (!itemId) {
    return Response.json({ error: "Subscription item not found" }, { status: 400 });
  }

  const updated = await stripe.subscriptions.update(parsed.data.subscriptionId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: "create_prorations",
  });

  return Response.json({ id: updated.id, status: updated.status });
});
