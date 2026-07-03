import "dotenv/config";
import { db } from "@/lib/db";
import { cookbooks, recipes, users } from "@/lib/db/schema";
import { TRIAL_DURATION_MS } from "@/lib/config/plans";

async function main() {
  const [user] = await db
    .insert(users)
    .values({
      email: "demo@example.com",
      displayName: "Recipe Vault Demo",
      planId: "trial",
      subscriptionStatus: "trialing",
      trialEndsAt: new Date(Date.now() + TRIAL_DURATION_MS),
    })
    .returning();

  const [cookbook] = await db
    .insert(cookbooks)
    .values({
      userId: user.id,
      title: "Family Favorites",
    })
    .returning();

  await db.insert(recipes).values({
    userId: user.id,
    cookbookId: cookbook.id,
    title: "Grandma's Apple Pie",
    description: "Classic apple pie with a flaky crust.",
    ingredients: [
      { id: "1", name: "Apples", quantity: 6, unit: "" },
      { id: "2", name: "Sugar", quantity: 0.75, unit: "cup" },
    ],
    steps: [
      { id: "1", order: 1, instruction: "Preheat oven to 375F." },
      { id: "2", order: 2, instruction: "Mix apples with sugar." },
    ],
  });

  console.log("Seed complete");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
