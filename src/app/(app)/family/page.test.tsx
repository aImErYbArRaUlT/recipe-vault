import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FamilyPage from "@/app/(app)/family/page";

describe("FamilyPage", () => {
  it("shows family details", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ name: "The Johnsons", inviteCode: "ABC12345" }),
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    render(<FamilyPage />);

    expect(await screen.findByText(/the johnsons/i)).toBeInTheDocument();
    expect(screen.getByText(/abc12345/i)).toBeInTheDocument();
  });

  it("creates a family", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: "The Johnsons", inviteCode: "ABC12345" }),
      });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    render(<FamilyPage />);

    // Wait for the loading skeleton to resolve and the "Start a family" form to render.
    const nameInput = await screen.findByLabelText(/family name/i);
    await userEvent.type(nameInput, "The Johnsons");
    await userEvent.click(screen.getByRole("button", { name: /create family/i }));

    expect(fetchMock).toHaveBeenCalledWith("/api/family", expect.any(Object));
  });
});
