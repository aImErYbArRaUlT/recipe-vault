import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScanPage from "@/app/(app)/scan/page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("ScanPage", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("disables submit until file selected", async () => {
    render(<ScanPage />);
    const button = screen.getByRole("button", { name: /scan recipe/i });
    expect(button).toBeDisabled();
  });

  it("uploads file and navigates to review", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fileUrl: "https://images.example.com/scans/user-1/job-1/original-1.jpg",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "job-1", status: "completed" }),
      });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    render(<ScanPage />);

    const input = screen.getByLabelText(/choose recipe images/i);
    const file = new File(["recipe"], "recipe.jpg", { type: "image/jpeg" });
    await userEvent.upload(input, file);

    const button = screen.getByRole("button", { name: /scan recipe/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/scan/review?jobId=job-1");
    });
  });
});
