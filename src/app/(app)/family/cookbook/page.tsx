"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RecipeThumb } from "@/components/ui/recipe-thumb";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionIcon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-shell";

type Cookbook = {
  id: string;
  title: string;
  description?: string | null;
};

type Recipe = {
  id: string;
  title: string;
  description?: string | null;
  originalImageUrls?: string[] | null;
};

export default function FamilyCookbookPage() {
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/family/cookbook")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setCookbook(data))
      .catch(() => setError("Unable to load family cookbook."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!cookbook?.id) return;
    fetch(`/api/cookbooks/${cookbook.id}/recipes`)
      .then((res) => res.json())
      .then((data) => setRecipes(data.recipes ?? []))
      .catch(() => setRecipes([]));
  }, [cookbook?.id]);

  if (loading) {
    return (
      <div className="grid gap-6">
        <PageHeader eyebrow="Family" title="Shared cookbook" />
        <Skeleton className="h-32 w-full !rounded-[var(--radius-card-lg)]" />
      </div>
    );
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Family"
        title={cookbook?.title ?? "Shared cookbook"}
        subtitle={cookbook?.description ?? "Recipes everyone in the family can cook from."}
      />

      {error ? (
        <Card tone="base" padding="lg" className="border-[var(--oxblood)]/30">
          <p className="text-sm font-medium text-[var(--oxblood)]">{error}</p>
        </Card>
      ) : null}

      {recipes === null ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full !rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <EmptyState
          tone="paper"
          icon={<CollectionIcon size={22} />}
          title="No shared recipes yet"
          description="Add a recipe to the shared cookbook from any recipe page."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="group overflow-hidden rounded-[var(--radius-card)] border border-[var(--rule)] bg-[var(--surface)] shadow-[var(--shadow-emboss)] transition-shadow hover:shadow-[var(--shadow-raised)]"
            >
              <RecipeThumb src={recipe.originalImageUrls?.[0]} title={recipe.title} />
              <div className="p-3 md:p-4">
                <div className="truncate text-sm font-semibold leading-tight md:text-base">
                  {recipe.title}
                </div>
                {recipe.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--ink-soft)] md:text-sm">
                    {recipe.description}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
