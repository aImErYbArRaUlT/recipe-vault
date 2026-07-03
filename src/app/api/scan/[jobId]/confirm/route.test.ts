/* @vitest-environment node */
import { POST } from "@/app/api/scan/[jobId]/confirm/route";
import { requireAuth } from "@/lib/auth-helpers";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { confirmScanJob } from "@/lib/services/scan";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/middleware/feature-gate", () => ({
  requireFeature: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

vi.mock("@/lib/services/scan", () => ({
  confirmScanJob: vi.fn(),
}));

describe("/api/scan/:jobId/confirm", () => {
  it("returns conflict when not ready", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(confirmScanJob).mockResolvedValue(null as never);

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ jobId: "job-1" }),
    });

    expect(response.status).toBe(409);
  });

  it("returns recipe when confirmed", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(confirmScanJob).mockResolvedValue({ id: "recipe-1" } as never);

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ jobId: "job-1" }),
    });

    expect(response.status).toBe(201);
  });
});
