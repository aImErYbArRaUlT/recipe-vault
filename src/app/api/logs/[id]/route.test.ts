/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { deleteCookLog, updateCookLog } from "@/lib/services/cook-logs";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/middleware/feature-gate", () => ({
  requireFeature: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

vi.mock("@/lib/services/cook-logs", () => ({
  updateCookLog: vi.fn(),
  deleteCookLog: vi.fn(),
}));

describe("/api/logs/:id", () => {
  it("rejects invalid update", async () => {
    const { PATCH } = (await import(
      "@/app/api/logs/[id]/route"
    )) as { PATCH: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ rating: 9 }),
      }),
      { params: Promise.resolve({ id: "log-1" }) }
    );

    expect(response.status).toBe(400);
  });

  it("updates a log", async () => {
    const { PATCH } = (await import(
      "@/app/api/logs/[id]/route"
    )) as { PATCH: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(updateCookLog).mockResolvedValue({ id: "log-1" } as never);

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ rating: 4, notes: "Nice" }),
      }),
      { params: Promise.resolve({ id: "log-1" }) }
    );

    expect(response.status).toBe(200);
  });

  it("deletes a log", async () => {
    const { DELETE } = (await import(
      "@/app/api/logs/[id]/route"
    )) as { DELETE: (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(deleteCookLog).mockResolvedValue({ id: "log-1" } as never);

    const response = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "log-1" }),
    });

    expect(response.status).toBe(200);
  });
});
