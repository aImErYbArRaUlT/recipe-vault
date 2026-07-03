/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { removeFamilyMember } from "@/lib/services/family";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/middleware/feature-gate", () => ({
  requireFeature: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

vi.mock("@/lib/services/family", () => ({
  removeFamilyMember: vi.fn(),
}));

describe("/api/family/members/:userId", () => {
  it("removes a member", async () => {
    const { DELETE } = (await import(
      "@/app/api/family/members/[userId]/route"
    )) as { DELETE: (req: Request, ctx: { params: Promise<{ userId: string }> }) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(removeFamilyMember).mockResolvedValue({ status: "removed" } as never);

    const response = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ userId: "user-2" }),
    });

    expect(response.status).toBe(200);
  });
});
