import { withAuth } from "@/lib/middleware/with-auth";
import { getStripe } from "@/lib/stripe";
import { ensureStripeCustomer } from "@/lib/services/billing";

export const POST = withAuth(async (_req, user) => {
  const customerId = await ensureStripeCustomer(user.id, user.email);
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/settings/billing`,
  });

  return Response.json({ url: session.url });
});
