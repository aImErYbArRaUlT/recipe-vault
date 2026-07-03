/* @vitest-environment node */
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { decideRoute } from "@/proxy";

describe("decideRoute", () => {
  describe("public routes", () => {
    it.each([
      "/",
      "/pricing",
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
      "/recipe/some-slug",
    ])("allows %s for anonymous user", (path) => {
      expect(decideRoute(path, false, null)).toEqual({ action: "next" });
    });

    it("allows public recipe links for logged-in users too", () => {
      expect(decideRoute("/recipe/abc", true, { planId: "free" })).toEqual({
        action: "next",
      });
    });
  });

  describe("unauthenticated", () => {
    it("redirects to /login for protected pages", () => {
      expect(decideRoute("/dashboard", false, null)).toEqual({
        action: "redirect",
        to: "/login",
      });
      expect(decideRoute("/recipes", false, null)).toEqual({
        action: "redirect",
        to: "/login",
      });
    });
  });

  describe("authenticated, free plan", () => {
    it("allows all pages (AI gating happens at API layer)", () => {
      const user = { planId: "free", subscriptionStatus: null };
      expect(decideRoute("/dashboard", true, user)).toEqual({ action: "next" });
      expect(decideRoute("/recipes", true, user)).toEqual({ action: "next" });
      expect(decideRoute("/cookbooks", true, user)).toEqual({ action: "next" });
    });
  });

  describe("authenticated, expired or locked", () => {
    it.each(["expired", "locked"])("redirects to /subscribe when status is %s", (status) => {
      const user = { planId: "pro", subscriptionStatus: status };
      expect(decideRoute("/dashboard", true, user)).toEqual({
        action: "redirect",
        to: "/subscribe",
      });
    });

    it("still lets expired users reach /subscribe and /settings/billing", () => {
      const user = { planId: "pro", subscriptionStatus: "expired" };
      expect(decideRoute("/subscribe", true, user)).toEqual({ action: "next" });
      expect(decideRoute("/settings/billing", true, user)).toEqual({ action: "next" });
    });
  });

  describe("authenticated, trial in flight", () => {
    it("allows trial users", () => {
      const user = {
        planId: "trial",
        subscriptionStatus: "trialing",
        trialEndsAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
      };
      expect(decideRoute("/dashboard", true, user)).toEqual({ action: "next" });
    });

    it("trial-expired users with stale subscription_status still allowed (cron will downgrade)", () => {
      // The cron flips planId to "free" when trialEndsAt passes; until then the
      // proxy doesn't block, so the user keeps soft access. AI calls 403 at the API.
      const user = {
        planId: "trial",
        subscriptionStatus: "trialing",
        trialEndsAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
      };
      expect(decideRoute("/dashboard", true, user)).toEqual({ action: "next" });
    });
  });
});
