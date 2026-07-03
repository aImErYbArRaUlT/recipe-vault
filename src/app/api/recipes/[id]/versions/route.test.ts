/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { listRecipeVersions } from "@/lib/services/recipe-versions";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/middleware/feature-gate", () => ({
  requireFeature: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

vi.mock("@/lib/services/recipe-versions", () => ({
  listRecipeVersions: vi.fn(),
}));

describe("/api/recipes/:id/versions", () => {
  it("lists versions", async () => {
    const { GET } = (await import(
      "@/app/api/recipes/[id]/versions/route"
    )) as { GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(listRecipeVersions).mockResolvedValue([] as never);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "recipe-1" }),
    });

    expect(response.status).toBe(200);
  });
});
