/* @vitest-environment node */
import { POST } from "@/app/api/scan/route";
import { requireAuth } from "@/lib/auth-helpers";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { createScanJob, processScanJob } from "@/lib/services/scan";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/middleware/feature-gate", () => ({
  requireFeature: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

vi.mock("@/lib/middleware/ai-limits", () => ({
  requireDailyAiCredit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/services/scan", () => ({
  createScanJob: vi.fn(),
  processScanJob: vi.fn(),
}));

describe("/api/scan", () => {
  it("rejects invalid payload", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);

    const response = await POST(
      new Request("http://localhost/api/scan", {
        method: "POST",
        body: JSON.stringify({ imageUrls: [] }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("creates and processes scan job", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(createScanJob).mockResolvedValue({ id: "job-1" } as never);
    vi.mocked(processScanJob).mockResolvedValue({ id: "job-1", status: "completed" } as never);

    const response = await POST(
      new Request("http://localhost/api/scan", {
        method: "POST",
        body: JSON.stringify({ imageUrls: ["https://img.example.com/1.jpg"] }),
      })
    );

    expect(response.status).toBe(201);
  });
});
