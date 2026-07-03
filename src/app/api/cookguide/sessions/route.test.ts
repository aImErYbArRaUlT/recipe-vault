/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { listCookingSessions } from "@/lib/services/cookguide";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/services/cookguide", () => ({
  listCookingSessions: vi.fn(),
}));

describe("/api/cookguide/sessions", () => {
  it("returns sessions", async () => {
    const { GET } = (await import(
      "@/app/api/cookguide/sessions/route"
    )) as { GET: () => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(listCookingSessions).mockResolvedValue([] as never);

    const response = await GET();
    expect(response.status).toBe(200);
  });
});
