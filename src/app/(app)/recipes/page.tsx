"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRecipesStore } from "@/lib/stores/recipes";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RecipeCardSkeleton } from "@/components/ui/skeleton";
import { RecipeThumb } from "@/components/ui/recipe-thumb";
import { PlusIcon, SearchIcon, BookIcon, CameraIcon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-shell";

export default function RecipesPage() {
  const recipes = useRecipesStore((s) => s.recipes);
  const ensureLoaded = useRecipesStore((s) => s.ensureLoaded);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  const filtered = useMemo(() => {
    if (!recipes) return [];
    if (!query.trim()) return recipes;
    const q = query.toLowerCase();
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.cuisine ?? "").toLowerCase().includes(q) ||
        (r.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [recipes, query]);

  return (
    <div className="grid gap-6 md:gap-8">
      <PageHeader
        eyebrow="The vault"
        title="Recipes"
        subtitle={
          recipes && recipes.length > 0
            ? `${recipes.length} ${recipes.length === 1 ? "recipe" : "recipes"} kept.`
            : undefined
        }
        action={
          <Button href="/recipes/new" variant="primary" leading={<PlusIcon size={16} />}>
            New
          </Button>
        }
      />

      {/* Search - only visible if there's something to search */}
      {recipes && recipes.length > 0 ? (
        <div className="relative">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]"
          />
          <input
            type="search"
            placeholder="Search by name, cuisine, or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search recipes"
            className="w-full rounded-full border border-[var(--rule)] bg-[var(--surface-raised)] py-3 pl-11 pr-4 text-sm shadow-[var(--shadow-emboss)] outline-none transition-colors placeholder:text-[var(--ink-soft)] hover:border-[var(--rule-strong)]"
          />
        </div>
      ) : null}

      {recipes === null ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <EmptyState
          tone="paper"
          icon={<BookIcon size={22} />}
          title="No recipes yet"
          description="Scan a handwritten card or add one from scratch to start your vault."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button href="/scan" variant="primary" leading={<CameraIcon size={18} />}>
                Scan a recipe
              </Button>
              <Button href="/recipes/new" variant="secondary" leading={<PlusIcon size={16} />}>
                Add manually
              </Button>
            </div>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          tone="paper"
          icon={<SearchIcon size={20} />}
          title="No matches"
          description={`Nothing in your vault matches “${query}”. Try a shorter search or check spelling.`}
          action={
            <Button variant="secondary" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
          {filtered.map((recipe) => {
            const hero = recipe.originalImageUrls?.[0] ?? null;
            const totalTime = recipe.totalTimeMinutes ?? recipe.cookTimeMinutes ?? null;
            const tags = (recipe.tags ?? []).slice(0, 2);
            const hasMeta = Boolean(recipe.cuisine || totalTime || tags.length);
            return (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group overflow-hidden rounded-[var(--radius-card)] border border-[var(--rule)] bg-[var(--surface)] shadow-[var(--shadow-emboss)] transition-shadow hover:shadow-[var(--shadow-raised)]"
              >
                <RecipeThumb src={hero} title={recipe.title} />
                <div className="p-3 md:p-4">
                  <div className="truncate text-sm font-semibold leading-tight md:text-base">
                    {recipe.title}
                  </div>
                  {recipe.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--ink-soft)] md:text-sm">
                      {recipe.description}
                    </p>
                  ) : null}
                  {hasMeta ? (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                      {recipe.cuisine ? <span>{recipe.cuisine}</span> : null}
                      {totalTime ? <span className="tabular">{totalTime} min</span> : null}
                      {tags.map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
