import { buildStorageKey } from "@/lib/storage";

describe("buildStorageKey", () => {
  it("builds scan keys", () => {
    const key = buildStorageKey("scan", "user-1", "original-1.jpg", "job-1");
    expect(key).toBe("scans/user-1/job-1/original-1.jpg");
  });

  it("builds avatar keys", () => {
    const key = buildStorageKey("avatar", "user-1", "ignored");
    expect(key).toBe("avatars/user-1.webp");
  });
});
