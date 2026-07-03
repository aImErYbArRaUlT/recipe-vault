/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { joinFamily } from "@/lib/services/family";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/middleware/feature-gate", () => ({
  requireFeature: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

vi.mock("@/lib/services/family", () => ({
  joinFamily: vi.fn(),
}));

describe("/api/family/join", () => {
  it("joins family with code", async () => {
    const { POST } = (await import("@/app/api/family/join/route")) as {
      POST: (req: Request) => Promise<Response>;
    };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(joinFamily).mockResolvedValue({ id: "family-1" } as never);

    const response = await POST(
      new Request("http://localhost/api/family/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode: "ABC12345" }),
      })
    );

    expect(response.status).toBe(200);
  });
});
