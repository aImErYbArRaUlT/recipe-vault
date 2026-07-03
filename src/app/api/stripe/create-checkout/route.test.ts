/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

describe("/api/stripe/create-checkout", () => {
  it("rejects invalid payload", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/test";
    const { POST } = await import("@/app/api/stripe/create-checkout/route");
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    const response = await POST(
      new Request("http://localhost/api/stripe/create-checkout", {
        method: "POST",
        body: JSON.stringify({ plan: "home" }),
      })
    );
    expect(response.status).toBe(400);
  });
});
