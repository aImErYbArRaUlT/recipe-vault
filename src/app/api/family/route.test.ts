/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { createFamily, getFamilyDetails, updateFamilyName } from "@/lib/services/family";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/middleware/feature-gate", () => ({
  requireFeature: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

vi.mock("@/lib/services/family", () => ({
  createFamily: vi.fn(),
  getFamilyDetails: vi.fn(),
  updateFamilyName: vi.fn(),
  listFamilyMembers: vi.fn().mockResolvedValue([]),
}));

describe("/api/family", () => {
  it("creates a family", async () => {
    const { POST } = (await import("@/app/api/family/route")) as {
      POST: (req: Request) => Promise<Response>;
    };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(createFamily).mockResolvedValue({ id: "family-1" } as never);

    const response = await POST(
      new Request("http://localhost/api/family", {
        method: "POST",
        body: JSON.stringify({ name: "The Johnsons" }),
      })
    );

    expect(response.status).toBe(201);
  });

  it("gets family details", async () => {
    const { GET } = (await import("@/app/api/family/route")) as {
      GET: () => Promise<Response>;
    };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(getFamilyDetails).mockResolvedValue({ id: "family-1" } as never);

    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("updates family name", async () => {
    const { PATCH } = (await import("@/app/api/family/route")) as {
      PATCH: (req: Request) => Promise<Response>;
    };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(updateFamilyName).mockResolvedValue({ id: "family-1" } as never);

    const response = await PATCH(
      new Request("http://localhost/api/family", {
        method: "PATCH",
        body: JSON.stringify({ name: "New Name" }),
      })
    );

    expect(response.status).toBe(200);
  });
});
