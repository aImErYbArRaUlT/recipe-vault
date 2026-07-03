import { eq } from "drizzle-orm";
import {
  mapRevenueCatEvent,
  validateWebhookAuth,
  type RevenueCatWebhookEvent,
} from "@/lib/revenuecat";
import { updateSubscriptionFromRevenueCat } from "@/lib/services/billing";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { paymentFailedEmail, planChangedEmail } from "@/lib/email/templates";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!validateWebhookAuth(authHeader)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.event) {
    return Response.json({ received: true });
  }

  const event = body.event as RevenueCatWebhookEvent;
  const mapped = mapRevenueCatEvent(event);

  if (!mapped) {
    return Response.json({ received: true });
  }

  const account = await db.query.users.findFirst({
    where: eq(users.id, mapped.appUserId),
  });

  if (!account) {
    return Response.json({ received: true });
  }

  const isStale =
    mapped.currentPeriodEnd &&
    account.currentPeriodEnd &&
    mapped.currentPeriodEnd <= account.currentPeriodEnd;

  if (!isStale) {
    await updateSubscriptionFromRevenueCat(mapped);
  }

  if (account.email && process.env.RESEND_API_KEY) {
    if (
      event.type === "BILLING_ISSUE_DETECTED" &&
      account.subscriptionStatus !== "past_due"
    ) {
      const manageUrl = `${process.env.NEXTAUTH_URL ?? ""}/settings/billing`;
      const message = paymentFailedEmail({ manageUrl });
      await sendEmail({
        to: account.email,
        subject: message.subject,
        html: message.html,
      });
    }

    if (
      (event.type === "INITIAL_PURCHASE" || event.type === "PRODUCT_CHANGE") &&
      account.planId !== mapped.planId
    ) {
      const label =
        mapped.planId.charAt(0).toUpperCase() + mapped.planId.slice(1);
      const message = planChangedEmail({ planName: label });
      await sendEmail({
        to: account.email,
        subject: message.subject,
        html: message.html,
      });
    }
  }

  return Response.json({ received: true });
}
