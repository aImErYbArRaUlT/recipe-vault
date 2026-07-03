/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { getFamilyCookbook } from "@/lib/services/family";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/middleware/feature-gate", () => ({
  requireFeature: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

vi.mock("@/lib/services/family", () => ({
  getFamilyCookbook: vi.fn(),
}));

describe("/api/family/cookbook", () => {
  it("returns shared cookbook", async () => {
    const { GET } = (await import("@/app/api/family/cookbook/route")) as {
      GET: () => Promise<Response>;
    };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(getFamilyCookbook).mockResolvedValue({ id: "cookbook-1" } as never);

    const response = await GET();
    expect(response.status).toBe(200);
  });
});
