import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { _resetRateLimitsForTests } from "./src/lib/middleware/rate-limit";

// Provide a dummy DATABASE_URL so modules that lazily reference it on import
// (transitively through @/lib/db) don't crash even when the test mocks the DB.
// Real tests still mock @/lib/db, so this connection is never actually opened.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
}

// jsdom doesn't implement URL.createObjectURL / revokeObjectURL. Components
// that build preview URLs from File objects rely on these.
if (typeof URL !== "undefined" && !URL.createObjectURL) {
  URL.createObjectURL = () => "blob:mock";
  URL.revokeObjectURL = () => {};
}

// Module-level state (in-memory rate-limit buckets, Zustand stores) persists
// across tests in the same vitest worker. Clear between tests so each one
// starts fresh.
afterEach(async () => {
  _resetRateLimitsForTests();
  try {
    const [
      { useFamilyStore },
      { useRecipesStore },
      { useCookbooksStore },
      { useUserStore },
    ] = await Promise.all([
      import("./src/lib/stores/family"),
      import("./src/lib/stores/recipes"),
      import("./src/lib/stores/cookbooks"),
      import("./src/lib/stores/user"),
    ]);
    useFamilyStore.getState().clear();
    useRecipesStore.getState().clear();
    useCookbooksStore.getState().clear();
    useUserStore.getState().clear();
  } catch {
    /* stores unavailable in this environment */
  }
});
