/* @vitest-environment node */
import { POST } from "@/app/api/upload/route";
import { requireAuth } from "@/lib/auth-helpers";
import { uploadFile } from "@/lib/r2";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/r2", () => ({
  uploadFile: vi.fn(),
}));

describe("/api/upload", () => {
  it("uploads a file and returns the file URL", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(uploadFile).mockResolvedValue(
      "https://images.example.com/scans/user-1/job-1/original-1.jpg",
    );

    const formData = new FormData();
    formData.append(
      "file",
      new File(["binary"], "original-1.jpg", { type: "image/jpeg" }),
    );
    formData.append("purpose", "scan");
    formData.append("subId", "job-1");

    const response = await POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.fileUrl).toBe(
      "https://images.example.com/scans/user-1/job-1/original-1.jpg",
    );
    expect(json.key).toContain("scans/user-1/job-1/");
  });

  it("rejects when no file is given", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);

    const formData = new FormData();
    formData.append("purpose", "scan");

    const response = await POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects invalid purpose", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);

    const formData = new FormData();
    formData.append(
      "file",
      new File(["x"], "a.jpg", { type: "image/jpeg" }),
    );
    formData.append("purpose", "not-a-purpose");

    const response = await POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      }),
    );
    expect(response.status).toBe(400);
  });
});
