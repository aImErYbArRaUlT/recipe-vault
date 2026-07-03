/* @vitest-environment node */
import { GET, POST } from "@/app/api/recipes/route";
import { requireAuth } from "@/lib/auth-helpers";
import { createRecipe, listRecipes } from "@/lib/services/recipes";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/services/recipes", () => ({
  listRecipes: vi.fn(),
  createRecipe: vi.fn(),
}));

const user = { id: "user-1" };

describe("/api/recipes", () => {
  it("lists recipes", async () => {
    vi.mocked(requireAuth).mockResolvedValue(user as never);
    vi.mocked(listRecipes).mockResolvedValue([] as never);

    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("creates a recipe", async () => {
    vi.mocked(requireAuth).mockResolvedValue(user as never);
    vi.mocked(createRecipe).mockResolvedValue({ id: "recipe-1" } as never);

    const response = await POST(
      new Request("http://localhost/api/recipes", {
        method: "POST",
        body: JSON.stringify({ title: "Cake" }),
      })
    );

    expect(response.status).toBe(201);
  });

  it("rejects invalid payload", async () => {
    vi.mocked(requireAuth).mockResolvedValue(user as never);

    const response = await POST(
      new Request("http://localhost/api/recipes", {
        method: "POST",
        body: JSON.stringify({ title: "" }),
      })
    );

    expect(response.status).toBe(400);
  });
});
