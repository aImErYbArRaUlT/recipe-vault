/* @vitest-environment node */
import { DELETE, PATCH } from "@/app/api/cookbooks/[id]/route";
import { requireAuth } from "@/lib/auth-helpers";
import { deleteCookbook, updateCookbook } from "@/lib/services/cookbooks";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/services/cookbooks", () => ({
  updateCookbook: vi.fn(),
  deleteCookbook: vi.fn(),
}));

describe("/api/cookbooks/:id", () => {
  it("rejects invalid update payload", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: 123 }),
      }),
      { params: Promise.resolve({ id: "cookbook-1" }) }
    );

    expect(response.status).toBe(400);
  });

  it("deletes cookbook", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(deleteCookbook).mockResolvedValue({ id: "cookbook-1" } as never);

    const response = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "cookbook-1" }),
    });

    expect(response.status).toBe(200);
  });
});
