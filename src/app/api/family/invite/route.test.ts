/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { generateInviteCode } from "@/lib/services/family";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/middleware/feature-gate", () => ({
  requireFeature: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

vi.mock("@/lib/services/family", () => ({
  generateInviteCode: vi.fn(),
}));

describe("/api/family/invite", () => {
  it("generates invite code", async () => {
    const { POST } = (await import("@/app/api/family/invite/route")) as {
      POST: (req: Request) => Promise<Response>;
    };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(generateInviteCode).mockResolvedValue({
      inviteCode: "ABC12345",
    } as never);

    const response = await POST(
      new Request("http://localhost/api/family/invite", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.inviteCode).toBe("ABC12345");
  });
});
