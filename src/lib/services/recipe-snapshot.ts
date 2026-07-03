export type RecipeSnapshot = Record<string, unknown> & {
  title: string;
  description: string | null;
  ingredients: unknown[];
  steps: unknown[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  total_time_minutes: number | null;
  servings: number | null;
  cuisine: string | null;
  tags: string[];
  difficulty: string | null;
  nutrition: Record<string, unknown> | null;
};

export interface RecipeSnapshotSource {
  title?: unknown;
  description?: unknown;
  ingredients?: unknown;
  steps?: unknown;
  prepTimeMinutes?: unknown;
  prep_time_minutes?: unknown;
  cookTimeMinutes?: unknown;
  cook_time_minutes?: unknown;
  totalTimeMinutes?: unknown;
  total_time_minutes?: unknown;
  servings?: unknown;
  cuisine?: unknown;
  tags?: unknown;
  difficulty?: unknown;
  nutrition?: unknown;
}

interface RecipeSnapshotOptions {
  titleFallback?: string;
  servingsFallback?: number | null;
}

function firstDefined(...values: unknown[]) {
  return values.find((value) => value !== undefined);
}

function stringOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return String(value);
}

function stringOrFallback(value: unknown, fallback: string) {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function numberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function arrayOrEmpty(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function tagsOrEmpty(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function recordOrNull(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function toRecipeSnapshot(
  source: RecipeSnapshotSource,
  options: RecipeSnapshotOptions = {}
): RecipeSnapshot {
  return {
    title: stringOrFallback(
      source.title,
      options.titleFallback ?? "Untitled Recipe"
    ),
    description: stringOrNull(source.description),
    ingredients: arrayOrEmpty(source.ingredients),
    steps: arrayOrEmpty(source.steps),
    prep_time_minutes: numberOrNull(
      firstDefined(source.prep_time_minutes, source.prepTimeMinutes)
    ),
    cook_time_minutes: numberOrNull(
      firstDefined(source.cook_time_minutes, source.cookTimeMinutes)
    ),
    total_time_minutes: numberOrNull(
      firstDefined(source.total_time_minutes, source.totalTimeMinutes)
    ),
    servings:
      numberOrNull(source.servings) ??
      options.servingsFallback ??
      null,
    cuisine: stringOrNull(source.cuisine),
    tags: tagsOrEmpty(source.tags),
    difficulty: stringOrNull(source.difficulty),
    nutrition: recordOrNull(source.nutrition),
  };
}

export function toRecipeWriteFields(snapshot: RecipeSnapshot) {
  return {
    title: snapshot.title,
    description: snapshot.description,
    ingredients: snapshot.ingredients,
    steps: snapshot.steps,
    prepTimeMinutes: snapshot.prep_time_minutes,
    cookTimeMinutes: snapshot.cook_time_minutes,
    totalTimeMinutes: snapshot.total_time_minutes,
    servings: snapshot.servings,
    cuisine: snapshot.cuisine,
    tags: snapshot.tags,
    difficulty: snapshot.difficulty,
    nutrition: snapshot.nutrition,
  };
}
