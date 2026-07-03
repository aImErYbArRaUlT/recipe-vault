/* @vitest-environment node */
import { DELETE, GET, PATCH } from "@/app/api/recipes/[id]/route";
import { requireAuth } from "@/lib/auth-helpers";
import { getRecipe, softDeleteRecipe, updateRecipe } from "@/lib/services/recipes";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/services/recipes", () => ({
  getRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  softDeleteRecipe: vi.fn(),
}));

const user = { id: "user-1" };

describe("/api/recipes/:id", () => {
  it("returns 404 when missing", async () => {
    vi.mocked(requireAuth).mockResolvedValue(user as never);
    vi.mocked(getRecipe).mockResolvedValue(null as never);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
  });

  it("updates a recipe", async () => {
    vi.mocked(requireAuth).mockResolvedValue(user as never);
    vi.mocked(updateRecipe).mockResolvedValue({ id: "recipe-1" } as never);

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      }),
      { params: Promise.resolve({ id: "recipe-1" }) }
    );

    expect(response.status).toBe(200);
  });

  it("rejects invalid update", async () => {
    vi.mocked(requireAuth).mockResolvedValue(user as never);

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: 12 }),
      }),
      { params: Promise.resolve({ id: "recipe-1" }) }
    );

    expect(response.status).toBe(400);
  });

  it("deletes a recipe", async () => {
    vi.mocked(requireAuth).mockResolvedValue(user as never);
    vi.mocked(softDeleteRecipe).mockResolvedValue({ id: "recipe-1" } as never);

    const response = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "recipe-1" }),
    });

    expect(response.status).toBe(200);
  });
});
