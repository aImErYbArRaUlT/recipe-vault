import type { User } from "@/lib/db/schema";

vi.mock("@/lib/auth-helpers", () => ({
  getAuthenticatedUser: vi.fn(),
}));

let hasFeature: typeof import("@/lib/middleware/feature-gate").hasFeature;
let canCreateCookbook: typeof import("@/lib/middleware/feature-gate").canCreateCookbook;

beforeAll(async () => {
  const mod = await import("@/lib/middleware/feature-gate");
  hasFeature = mod.hasFeature;
  canCreateCookbook = mod.canCreateCookbook;
});

const baseUser: User = {
  id: "user-1",
  name: null,
  email: "user@example.com",
  emailVerified: null,
  displayName: null,
  image: null,
  passwordHash: null,
  skillLevel: "intermediate",
  dietaryRestrictions: [],
  measurementSystem: "imperial",
  defaultServings: 4,
  voiceEnabled: true,
  stripeCustomerId: null,
  revenuecatCustomerId: null,
  planId: "trial",
  subscriptionStatus: "trialing",
  subscriptionPlatform: null,
  billingInterval: null,
  trialEndsAt: new Date(Date.now() + 1000 * 60 * 60),
  currentPeriodEnd: null,
  familyId: null,
  familyRole: null,
  onboardingComplete: false,
  aiCallsCount: 0,
  aiCallsDate: null,
  trialReminderStage: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("hasFeature", () => {
  it("allows pro features during trial", () => {
    expect(hasFeature(baseUser, "ai_scanning")).toBe(true);
  });

  it("falls back to free when trial expired", () => {
    const expired = { ...baseUser, trialEndsAt: new Date(Date.now() - 1000) } as User;
    expect(hasFeature(expired, "ai_scanning")).toBe(false);
  });

  it("blocks free plan from all AI features", () => {
    const free = { ...baseUser, planId: "free", subscriptionStatus: null } as User;
    expect(hasFeature(free, "ai_scanning")).toBe(false);
    expect(hasFeature(free, "ai_voice_companion")).toBe(false);
    expect(hasFeature(free, "ai_modifications")).toBe(false);
    expect(hasFeature(free, "ai_substitutions")).toBe(false);
    expect(hasFeature(free, "ai_nutrition")).toBe(false);
  });

  it("allows pro features for active pro subscription", () => {
    const pro = {
      ...baseUser,
      planId: "pro",
      subscriptionStatus: "active",
    } as User;
    expect(hasFeature(pro, "ai_scanning")).toBe(true);
    expect(hasFeature(pro, "ai_voice_companion")).toBe(true);
    expect(hasFeature(pro, "family_sharing")).toBe(false);
  });

  it("allows family sharing only on family plan", () => {
    const fam = {
      ...baseUser,
      planId: "family",
      subscriptionStatus: "active",
    } as User;
    expect(hasFeature(fam, "family_sharing")).toBe(true);

    const pro = { ...baseUser, planId: "pro", subscriptionStatus: "active" } as User;
    expect(hasFeature(pro, "family_sharing")).toBe(false);
  });

  it("falls back to free when paid plan has cancelled status", () => {
    const cancelled = {
      ...baseUser,
      planId: "pro",
      subscriptionStatus: "cancelled",
    } as User;
    expect(hasFeature(cancelled, "ai_scanning")).toBe(false);
  });

  it("treats past_due subscription as still active (grace period)", () => {
    const pastDue = {
      ...baseUser,
      planId: "pro",
      subscriptionStatus: "past_due",
    } as User;
    expect(hasFeature(pastDue, "ai_scanning")).toBe(true);
  });
});

describe("canCreateCookbook", () => {
  it("limits free plan to 2 cookbooks", () => {
    const free = { ...baseUser, planId: "free" } as User;
    expect(canCreateCookbook(free, 1)).toBe(true);
    expect(canCreateCookbook(free, 2)).toBe(false);
  });

  it("limits legacy home plan to 3 cookbooks", () => {
    const home = { ...baseUser, planId: "home" } as User;
    expect(canCreateCookbook(home, 2)).toBe(true);
    expect(canCreateCookbook(home, 3)).toBe(false);
  });

  it("does not limit trial users", () => {
    expect(canCreateCookbook(baseUser, 100)).toBe(true);
  });

  it("does not limit pro users", () => {
    const pro = { ...baseUser, planId: "pro" } as User;
    expect(canCreateCookbook(pro, 100)).toBe(true);
  });

  it("does not limit family users", () => {
    const fam = { ...baseUser, planId: "family" } as User;
    expect(canCreateCookbook(fam, 100)).toBe(true);
  });
});
