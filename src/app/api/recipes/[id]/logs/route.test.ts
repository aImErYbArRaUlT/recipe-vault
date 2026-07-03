/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { createCookLog, listCookLogs } from "@/lib/services/cook-logs";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/middleware/feature-gate", () => ({
  requireFeature: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

vi.mock("@/lib/services/cook-logs", () => ({
  listCookLogs: vi.fn(),
  createCookLog: vi.fn(),
}));

describe("/api/recipes/:id/logs", () => {
  it("lists cook logs", async () => {
    const { GET } = (await import(
      "@/app/api/recipes/[id]/logs/route"
    )) as { GET: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(listCookLogs).mockResolvedValue([] as never);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "recipe-1" }),
    });

    expect(response.status).toBe(200);
  });

  it("creates a cook log", async () => {
    const { POST } = (await import(
      "@/app/api/recipes/[id]/logs/route"
    )) as { POST: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(createCookLog).mockResolvedValue({ id: "log-1" } as never);

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ rating: 5, notes: "Great" }),
      }),
      { params: Promise.resolve({ id: "recipe-1" }) }
    );

    expect(response.status).toBe(201);
  });

  it("rejects invalid payload", async () => {
    const { POST } = (await import(
      "@/app/api/recipes/[id]/logs/route"
    )) as { POST: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ rating: 7 }),
      }),
      { params: Promise.resolve({ id: "recipe-1" }) }
    );

    expect(response.status).toBe(400);
  });
});
