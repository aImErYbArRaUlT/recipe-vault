/* @vitest-environment node */
import { requireAuth } from "@/lib/auth-helpers";
import { requireFeature } from "@/lib/middleware/feature-gate";
import { appendCookingMessage } from "@/lib/services/cookguide";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/middleware/feature-gate", () => ({
  requireFeature: vi.fn(() => vi.fn().mockResolvedValue(null)),
}));

vi.mock("@/lib/middleware/ai-limits", () => ({
  requireDailyAiCredit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/services/cookguide", () => ({
  appendCookingMessage: vi.fn(),
}));

const findFirstCookingSessions = vi.fn();
const findFirstRecipes = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      cookingSessions: { findFirst: findFirstCookingSessions },
      recipes: { findFirst: findFirstRecipes },
    },
  },
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateCookingAssistantResponse: vi.fn(async () => "Mocked assistant reply."),
}));

describe("/api/cookguide/message", () => {
  it("rejects invalid payload", async () => {
    const { POST } = (await import(
      "@/app/api/cookguide/message/route"
    )) as { POST: (req: Request) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);

    const response = await POST(
      new Request("http://localhost/api/cookguide/message", {
        method: "POST",
        body: JSON.stringify({ sessionId: "" }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("streams assistant response", async () => {
    const { POST } = (await import(
      "@/app/api/cookguide/message/route"
    )) as { POST: (req: Request) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(appendCookingMessage).mockResolvedValue({ id: "session-1" } as never);
    findFirstCookingSessions.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      recipeId: "recipe-1",
      messages: [],
    });
    findFirstRecipes.mockResolvedValue({
      id: "recipe-1",
      userId: "user-1",
      title: "Pancakes",
      ingredients: [],
      steps: [],
    });

    const response = await POST(
      new Request("http://localhost/api/cookguide/message", {
        method: "POST",
        body: JSON.stringify({ sessionId: "session-1", message: "Next step" }),
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
  });

  it("streams timer event when requested", async () => {
    const { POST } = (await import(
      "@/app/api/cookguide/message/route"
    )) as { POST: (req: Request) => Promise<Response> };

    vi.mocked(requireAuth).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(appendCookingMessage).mockResolvedValue({ id: "session-1" } as never);
    findFirstCookingSessions.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      recipeId: "recipe-1",
      messages: [],
    });
    findFirstRecipes.mockResolvedValue({
      id: "recipe-1",
      userId: "user-1",
      title: "Pancakes",
      ingredients: [],
      steps: [],
    });

    const response = await POST(
      new Request("http://localhost/api/cookguide/message", {
        method: "POST",
        body: JSON.stringify({
          sessionId: "session-1",
          message: "Set a timer",
          timerSeconds: 120,
        }),
      })
    );

    const reader = response.body?.getReader();
    let combined = "";
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        combined += new TextDecoder().decode(value);
      }
    }
    expect(combined).toContain("event: timer");
    expect(combined).toContain("120");
  });
});
