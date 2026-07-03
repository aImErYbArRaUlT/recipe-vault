import { PostHog } from "posthog-node";

const client = process.env.POSTHOG_KEY
  ? new PostHog(process.env.POSTHOG_KEY, {
      host: process.env.POSTHOG_HOST ?? "https://app.posthog.com",
    })
  : null;

export function trackEvent(userId: string, event: string, properties?: Record<string, unknown>) {
  if (!client) return;
  client.capture({
    distinctId: userId,
    event,
    properties,
  });
}

export async function flushAnalytics() {
  if (!client) return;
  await client.shutdown();
}
