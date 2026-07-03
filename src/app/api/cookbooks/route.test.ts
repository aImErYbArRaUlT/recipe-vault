/* @vitest-environment node */
import { GET, POST } from "@/app/api/cookbooks/route";
import { requireAuth } from "@/lib/auth-helpers";
import { createCookbook, listCookbooks } from "@/lib/services/cookbooks";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/services/cookbooks", () => ({
  listCookbooks: vi.fn(),
  createCookbook: vi.fn(),
}));

describe("/api/cookbooks", () => {
  it("lists cookbooks", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(listCookbooks).mockResolvedValue([] as never);

    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("blocks home plan limit", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      id: "user-1",
      planId: "home",
    } as never);
    vi.mocked(listCookbooks).mockResolvedValue([{}, {}, {}] as never);

    const response = await POST(
      new Request("http://localhost/api/cookbooks", {
        method: "POST",
        body: JSON.stringify({ title: "New" }),
      })
    );

    expect(response.status).toBe(403);
  });

  it("creates a cookbook", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1", planId: "pro" } as never);
    vi.mocked(listCookbooks).mockResolvedValue([] as never);
    vi.mocked(createCookbook).mockResolvedValue({ id: "cookbook-1" } as never);

    const response = await POST(
      new Request("http://localhost/api/cookbooks", {
        method: "POST",
        body: JSON.stringify({ title: "Desserts" }),
      })
    );

    expect(response.status).toBe(201);
  });
});
