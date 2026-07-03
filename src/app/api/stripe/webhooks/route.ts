import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";
import { updateSubscriptionFromStripe, planForPrice } from "@/lib/services/billing";
import { db } from "@/lib/db";
import { users, webhookEvents } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { paymentFailedEmail, planChangedEmail } from "@/lib/email/templates";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    );
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: skip events already processed (Stripe retries and replays).
  const already = await db.query.webhookEvents.findFirst({
    where: eq(webhookEvents.id, event.id),
  });
  if (already) {
    return Response.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const customerId =
        typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      if (customerId && subscriptionId) {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id ?? null;
        const currentPeriodEnd =
          (subscription as unknown as { current_period_end?: number })
            .current_period_end ?? null;
        await updateSubscriptionFromStripe({
          customerId,
          priceId,
          status: subscription.status,
          currentPeriodEnd,
        });
      }
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object;
      const firstLine = invoice.lines.data[0] as
        | (typeof invoice.lines.data)[number]
        | undefined;
      const priceId =
        (firstLine as unknown as { price?: { id?: string } })?.price?.id ??
        null;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : null;
      if (customerId) {
        await updateSubscriptionFromStripe({
          customerId,
          priceId,
          status: "active",
          currentPeriodEnd: invoice.period_end ?? null,
        });
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const firstLine = invoice.lines.data[0] as
        | (typeof invoice.lines.data)[number]
        | undefined;
      const priceId =
        (firstLine as unknown as { price?: { id?: string } })?.price?.id ??
        null;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : null;
      if (customerId) {
        await updateSubscriptionFromStripe({
          customerId,
          priceId,
          status: "past_due",
          currentPeriodEnd: invoice.period_end ?? null,
        });

        const account = await db.query.users.findFirst({
          where: eq(users.stripeCustomerId, customerId),
        });
        if (account?.email && process.env.RESEND_API_KEY) {
          const manageUrl = `${process.env.NEXTAUTH_URL ?? ""}/settings/billing`;
          const message = paymentFailedEmail({ manageUrl });
          await sendEmail({ to: account.email, subject: message.subject, html: message.html });
        }
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : null;
      const priceId = subscription.items?.data[0]?.price?.id ?? null;
      if (customerId) {
        const currentPeriodEnd =
          (subscription as unknown as { current_period_end?: number })
            .current_period_end ?? null;
        await updateSubscriptionFromStripe({
          customerId,
          priceId,
          status: subscription.status,
          currentPeriodEnd,
        });

        const plan = planForPrice(priceId)?.planId ?? null;
        const account = await db.query.users.findFirst({
          where: eq(users.stripeCustomerId, customerId),
        });
        if (account?.email && plan && process.env.RESEND_API_KEY) {
          const label = plan.charAt(0).toUpperCase() + plan.slice(1);
          const message = planChangedEmail({ planName: label });
          await sendEmail({ to: account.email, subject: message.subject, html: message.html });
        }
      }
      break;
    }
    default:
      break;
  }

  // Record the event so retries and replays are ignored next time.
  await db
    .insert(webhookEvents)
    .values({ id: event.id, provider: "stripe" })
    .onConflictDoNothing();

  return Response.json({ received: true });
}
