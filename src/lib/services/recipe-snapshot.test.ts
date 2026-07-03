import { toRecipeSnapshot, toRecipeWriteFields } from "@/lib/services/recipe-snapshot";

describe("toRecipeSnapshot", () => {
  it("maps a recipe row to the structured snake_case snapshot", () => {
    expect(
      toRecipeSnapshot({
        title: "Chili",
        description: "Weeknight pot",
        ingredients: [{ name: "beans" }],
        steps: [{ text: "Simmer" }],
        prepTimeMinutes: 10,
        cookTimeMinutes: 35,
        totalTimeMinutes: 45,
        servings: 4,
        cuisine: "Tex-Mex",
        tags: ["dinner"],
        difficulty: "easy",
        nutrition: { calories: 350 },
      })
    ).toEqual({
      title: "Chili",
      description: "Weeknight pot",
      ingredients: [{ name: "beans" }],
      steps: [{ text: "Simmer" }],
      prep_time_minutes: 10,
      cook_time_minutes: 35,
      total_time_minutes: 45,
      servings: 4,
      cuisine: "Tex-Mex",
      tags: ["dinner"],
      difficulty: "easy",
      nutrition: { calories: 350 },
    });
  });

  it("accepts parsed snake_case fields and emits DB write fields", () => {
    const snapshot = toRecipeSnapshot({
      title: "Soup",
      ingredients: [{ item: "carrot" }],
      steps: [{ text: "Blend" }],
      prep_time_minutes: "5",
      cook_time_minutes: "20",
      total_time_minutes: "25",
      tags: "quick, vegetarian",
    });

    expect(toRecipeWriteFields(snapshot)).toMatchObject({
      title: "Soup",
      ingredients: [{ item: "carrot" }],
      steps: [{ text: "Blend" }],
      prepTimeMinutes: 5,
      cookTimeMinutes: 20,
      totalTimeMinutes: 25,
      tags: ["quick", "vegetarian"],
    });
  });

  it("applies fallbacks for missing title and servings", () => {
    expect(toRecipeSnapshot({}, { servingsFallback: 4 })).toMatchObject({
      title: "Untitled Recipe",
      servings: 4,
      ingredients: [],
      steps: [],
      tags: [],
    });
  });
});
