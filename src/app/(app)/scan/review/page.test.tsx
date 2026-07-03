import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScanReviewPage from "@/app/(app)/scan/review/page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("jobId=job-1"),
}));

describe("ScanReviewPage", () => {
  it("loads and confirms scan job", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "job-1",
          status: "completed",
          parsedRecipe: { title: "Cake" },
          thumbnailUrl: "https://images.example.com/thumb.webp",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "recipe-1" }),
      });

    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    render(<ScanReviewPage />);

    // Title is rendered into an Input field; check its value.
    const titleInput = (await screen.findByLabelText(/title/i)) as HTMLInputElement;
    expect(titleInput.value).toBe("Cake");
    expect(screen.getByAltText(/scan thumbnail/i)).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /save to vault/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/scan/job-1/confirm",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });
});
