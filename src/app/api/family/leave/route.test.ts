/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { leaveFamily } from "@/lib/services/family";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/services/family", () => ({
  leaveFamily: vi.fn(),
}));

describe("/api/family/leave", () => {
  it("leaves family", async () => {
    const { POST } = (await import("@/app/api/family/leave/route")) as {
      POST: () => Promise<Response>;
    };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(leaveFamily).mockResolvedValue({ status: "left" } as never);

    const response = await POST();
    expect(response.status).toBe(200);
  });
});
