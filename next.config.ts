import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const r2Hostname = (() => {
  try {
    if (!process.env.R2_PUBLIC_URL) return null;
    return new URL(process.env.R2_PUBLIC_URL).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Allow next/image to optimize images served from our R2 public bucket.
    // Additional hosts can be added here as we expand storage.
    remotePatterns: [
      ...(r2Hostname
        ? [{ protocol: "https" as const, hostname: r2Hostname }]
        : []),
      // Cloudflare R2 default subdomain pattern.
      { protocol: "https" as const, hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https" as const, hostname: "*.r2.dev" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
});
