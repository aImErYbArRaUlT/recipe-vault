/* @vitest-environment node */

describe("/api/stripe/webhooks", () => {
  it("returns 400 without signature", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/test";
    const { POST } = await import("@/app/api/stripe/webhooks/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/webhooks", {
        method: "POST",
        body: "payload",
      })
    );

    expect(response.status).toBe(400);
  });
});
