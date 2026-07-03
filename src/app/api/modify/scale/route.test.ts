/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

describe("/api/modify/scale", () => {
  it("rejects invalid payload", async () => {
    const { POST } = (await import("@/app/api/modify/scale/route")) as {
      POST: (req: Request) => Promise<Response>;
    };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);

    const response = await POST(
      new Request("http://localhost/api/modify/scale", {
        method: "POST",
        body: JSON.stringify({ currentServings: 2 }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("scales ingredient quantities", async () => {
    const { POST } = (await import("@/app/api/modify/scale/route")) as {
      POST: (req: Request) => Promise<Response>;
    };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);

    const response = await POST(
      new Request("http://localhost/api/modify/scale", {
        method: "POST",
        body: JSON.stringify({
          currentServings: 2,
          targetServings: 4,
          ingredients: [{ name: "flour", quantity: 2, unit: "cup" }],
        }),
      })
    );

    const json = await response.json();
    expect(json.ingredients[0].quantity).toBe(4);
  });
});
