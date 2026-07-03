/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { createCookingSession } from "@/lib/services/cookguide";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/middleware/feature-gate", () => ({
  requireFeature: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

vi.mock("@/lib/services/cookguide", () => ({
  createCookingSession: vi.fn(),
}));

describe("/api/cookguide/start", () => {
  it("rejects invalid payload", async () => {
    const { POST } = (await import(
      "@/app/api/cookguide/start/route"
    )) as { POST: (req: Request) => Promise<Response> };
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);

    const response = await POST(
      new Request("http://localhost/api/cookguide/start", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
  });

  it("creates a cooking session", async () => {
    const { POST } = (await import(
      "@/app/api/cookguide/start/route"
    )) as { POST: (req: Request) => Promise<Response> };
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(createCookingSession).mockResolvedValue({ id: "session-1" } as never);

    const response = await POST(
      new Request("http://localhost/api/cookguide/start", {
        method: "POST",
        body: JSON.stringify({ recipeId: "recipe-1" }),
      })
    );

    expect(response.status).toBe(201);
  });
});
