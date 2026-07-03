import { slugify, uniqueSlug } from "@/lib/slug";

describe("slugify", () => {
  it("creates a url-safe slug", () => {
    expect(slugify("Grandma's Cake Recipe!"))
      .toBe("grandma-s-cake-recipe");
  });

  it("trims long slugs", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });
});

describe("uniqueSlug", () => {
  it("adds a suffix", () => {
    const slug = uniqueSlug("recipe");
    expect(slug.startsWith("recipe-")).toBe(true);
  });
});
