/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { endCookingSession } from "@/lib/services/cookguide";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/services/cookguide", () => ({
  endCookingSession: vi.fn(),
}));

describe("/api/cookguide/end", () => {
  it("rejects invalid payload", async () => {
    const { POST } = (await import(
      "@/app/api/cookguide/end/route"
    )) as { POST: (req: Request) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);

    const response = await POST(
      new Request("http://localhost/api/cookguide/end", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
  });

  it("ends a session", async () => {
    const { POST } = (await import(
      "@/app/api/cookguide/end/route"
    )) as { POST: (req: Request) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(endCookingSession).mockResolvedValue({ id: "session-1" } as never);

    const response = await POST(
      new Request("http://localhost/api/cookguide/end", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-1" }),
      })
    );

    expect(response.status).toBe(200);
  });
});
