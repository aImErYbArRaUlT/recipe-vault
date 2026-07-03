/* @vitest-environment node */
import { POST } from "@/app/api/auth/signup/route";
import { createCredentialsUser } from "@/lib/services/users";

vi.mock("@/lib/services/users", () => ({
  createCredentialsUser: vi.fn(),
}));

describe("POST /api/auth/signup", () => {
  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email: "bad" }),
      })
    );

    expect(response.status).toBe(400);
  });

  it("creates a user", async () => {
    vi.mocked(createCredentialsUser).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    } as never);

    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
          displayName: "User",
        }),
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.id).toBe("user-1");
  });
});
