/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { restoreRecipeVersion } from "@/lib/services/recipe-versions";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/middleware/feature-gate", () => ({
  requireFeature: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

vi.mock("@/lib/services/recipe-versions", () => ({
  restoreRecipeVersion: vi.fn(),
}));

describe("/api/recipes/:id/restore/:v", () => {
  it("returns 404 when missing", async () => {
    const { POST } = (await import(
      "@/app/api/recipes/[id]/restore/[v]/route"
    )) as { POST: (req: Request, ctx: { params: Promise<{ id: string; v: string }> }) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(restoreRecipeVersion).mockResolvedValue(null as never);

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "recipe-1", v: "1" }),
    });

    expect(response.status).toBe(404);
  });

  it("restores a version", async () => {
    const { POST } = (await import(
      "@/app/api/recipes/[id]/restore/[v]/route"
    )) as { POST: (req: Request, ctx: { params: Promise<{ id: string; v: string }> }) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(restoreRecipeVersion).mockResolvedValue({ id: "recipe-1" } as never);

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "recipe-1", v: "2" }),
    });

    expect(response.status).toBe(200);
  });
});
