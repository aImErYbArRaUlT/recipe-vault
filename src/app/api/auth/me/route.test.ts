/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
  toClientUser: (u: unknown) => u,
}));

describe("/api/auth/me", () => {
  it("returns current user", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/test";
    const { GET } = await import("@/app/api/auth/me/route");
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("rejects invalid update payload", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/test";
    const { PATCH } = await import("@/app/api/auth/me/route");
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    const response = await PATCH(
      new Request("http://localhost/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ defaultServings: "bad" }),
      })
    );
    expect(response.status).toBe(400);
  });
});
