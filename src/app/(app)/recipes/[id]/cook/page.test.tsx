import { Suspense } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CookRecipePage from "@/app/(app)/recipes/[id]/cook/page";

async function renderCook(id = "recipe-1") {
  // Stable Promise reference so re-renders don't restart suspension.
  const params = Promise.resolve({ id });
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <Suspense fallback={<div>loading</div>}>
        <CookRecipePage params={params} />
      </Suspense>,
    );
  });
  // Let the use() Promise + useEffect chain settle.
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  return result;
}

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

// Voice features need browser APIs not in jsdom; the hook returns a stable
// "unsupported" shape so the page renders without trying to bind audio.
vi.mock("@/lib/hooks/use-voice", () => ({
  useVoice: () => ({
    supported: false,
    conversationActive: false,
    listening: false,
    recording: false,
    speaking: false,
    sttMethod: "browser",
    startConversation: vi.fn(),
    stopConversation: vi.fn(),
    listen: vi.fn(),
    stopListening: vi.fn(),
    speak: vi.fn(),
    speakAndListen: vi.fn(),
  }),
}));

vi.mock("@/components/ui/sheet", async () => {
  const actual =
    await vi.importActual<typeof import("@/components/ui/sheet")>(
      "@/components/ui/sheet",
    );
  return {
    ...actual,
    useConfirm: () => vi.fn().mockResolvedValue(true),
  };
});

const mockRecipe = {
  title: "Pancakes",
  ingredients: [{ name: "Flour" }],
  steps: [
    { instruction: "Mix the batter." },
    { instruction: "Pour onto griddle." },
    { instruction: "Flip when bubbles form." },
  ],
};

function stubFetchWithRecipe() {
  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url.startsWith("/api/recipes/")) {
      return Promise.resolve({
        ok: true,
        json: async () => mockRecipe,
      });
    }
    if (url.startsWith("/api/cookguide/start")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ id: "session-1" }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
}

beforeEach(() => {
  push.mockClear();
});

describe("CookRecipePage", () => {
  it("navigates between steps", async () => {
    stubFetchWithRecipe();

    await renderCook();

    expect(await screen.findByText(/mix the batter/i)).toBeInTheDocument();

    const next = screen.getByRole("button", { name: /next step/i });
    await userEvent.click(next);
    expect(screen.getByText(/pour onto griddle/i)).toBeInTheDocument();

    const previous = screen.getByRole("button", { name: /previous/i });
    await userEvent.click(previous);
    expect(screen.getByText(/mix the batter/i)).toBeInTheDocument();
  });

  it("disables Previous on the first step", async () => {
    stubFetchWithRecipe();

    await renderCook();

    await screen.findByText(/mix the batter/i);

    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("disables Next on the last step", async () => {
    stubFetchWithRecipe();

    await renderCook();

    await screen.findByText(/mix the batter/i);

    const next = screen.getByRole("button", { name: /next step/i });
    await userEvent.click(next);
    await userEvent.click(next);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /next step/i }),
      ).toBeDisabled();
    });
  });
});
