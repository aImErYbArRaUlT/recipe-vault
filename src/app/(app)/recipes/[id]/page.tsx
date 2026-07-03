"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { getAppUrl } from "@/lib/app-url";
import { useRecipesStore } from "@/lib/stores/recipes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatGrid } from "@/components/ui/stat";
import { useConfirm } from "@/components/ui/sheet";
import { BookIcon } from "@/components/ui/icon";
import { haptic } from "@/components/ui/haptics";

type Ingredient = {
  name: string;
  quantity?: number;
  unit?: string;
  preparation?: string;
};

type Step = {
  instruction: string;
  timerSeconds?: number | null;
};

type Recipe = {
  id: string;
  title: string;
  description?: string | null;
  ingredients?: Ingredient[] | null;
  steps?: Step[] | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  totalTimeMinutes?: number | null;
  servings?: number | null;
  cuisine?: string | null;
  tags?: string[] | null;
  difficulty?: string | null;
  nutrition?: Record<string, unknown> | null;
  originalImageUrls?: string[] | null;
  isPublic?: boolean | null;
  publicSlug?: string | null;
  version?: number | null;
};

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

function formatIngredient(i: Ingredient) {
  const parts: string[] = [];
  if (i.quantity) parts.push(String(i.quantity));
  if (i.unit) parts.push(i.unit);
  parts.push(i.name);
  let line = parts.join(" ");
  if (i.preparation) line += `, ${i.preparation}`;
  return line;
}

export default function RecipeDetailPage({ params }: RecipePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const confirm = useConfirm();
  const removeFromList = useRecipesStore((s) => s.remove);
  const invalidateRecipes = useRecipesStore((s) => s.invalidate);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/recipes/${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          throw new Error("not_found");
        }
        return res.json();
      })
      .then((data) => {
        setRecipe(data);
        if (data?.publicSlug) {
          setShareUrl(`${getAppUrl()}/recipe/${data.publicSlug}`);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err?.message !== "not_found") setError("Failed to load recipe.");
        setLoading(false);
      });
  }, [id]);

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete this recipe?",
      description:
        "The recipe, scans, and cook log history will be removed. This can't be undone.",
      confirmLabel: "Delete recipe",
      cancelLabel: "Keep it",
      tone: "destructive",
    });
    if (!ok) return;
    const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete recipe.");
      return;
    }
    removeFromList(id);
    void haptic("success");
    router.push("/recipes");
  }

  async function handleShare() {
    setError("");
    const res = await fetch(`/api/recipes/${id}/share`, { method: "POST" });
    if (!res.ok) {
      setError("Failed to create share link.");
      return;
    }
    const data = await res.json();
    setShareUrl(`${getAppUrl()}${data.url}`);
    void haptic("success");
  }

  async function handleUnshare() {
    const ok = await confirm({
      title: "Remove public link?",
      description: "The shared URL will stop working immediately.",
      confirmLabel: "Remove link",
      tone: "destructive",
    });
    if (!ok) return;
    const res = await fetch(`/api/recipes/${id}/share`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to remove share link.");
      return;
    }
    setShareUrl(null);
  }

  async function handleFork() {
    setError("");
    const res = await fetch(`/api/recipes/${id}/fork`, { method: "POST" });
    if (!res.ok) {
      setError("Failed to fork recipe.");
      return;
    }
    const data = await res.json();
    invalidateRecipes();
    void haptic("light");
    router.push(`/recipes/${data.id}`);
  }

  async function copyShare() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      void haptic("success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-24 !rounded-full" />
          <Skeleton className="h-11 w-20 !rounded-full" />
          <Skeleton className="h-11 w-20 !rounded-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full !rounded-[var(--radius-card-lg)]" />
          <Skeleton className="h-64 w-full !rounded-[var(--radius-card-lg)]" />
        </div>
      </div>
    );
  }

  if (notFound || !recipe) {
    return (
      <EmptyState
        icon={<BookIcon size={22} />}
        title="Recipe not found"
        description="It may have been deleted, or the link is broken."
        action={
          <Button href="/recipes" variant="primary">
            Back to recipes
          </Button>
        }
      />
    );
  }

  const ingredients = recipe.ingredients ?? [];
  const steps = recipe.steps ?? [];
  const scans = recipe.originalImageUrls ?? [];
  const tags = recipe.tags ?? [];

  const metaItems = [
    recipe.prepTimeMinutes ? { label: "Prep", value: `${recipe.prepTimeMinutes} min` } : null,
    recipe.cookTimeMinutes ? { label: "Cook", value: `${recipe.cookTimeMinutes} min` } : null,
    recipe.totalTimeMinutes ? { label: "Total", value: `${recipe.totalTimeMinutes} min` } : null,
    recipe.servings ? { label: "Servings", value: String(recipe.servings) } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const nutritionEntries = recipe.nutrition
    ? Object.entries(recipe.nutrition).filter(([, v]) => v !== null && v !== undefined && v !== "")
    : [];

  return (
    <div className="grid gap-7 md:gap-9">
      {/* TITLE BLOCK */}
      <header className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {recipe.cuisine ? <Badge tone="accent">{recipe.cuisine}</Badge> : null}
          {recipe.difficulty ? <Badge tone="neutral">{recipe.difficulty}</Badge> : null}
          {recipe.isPublic ? <Badge tone="moss" dot>Public</Badge> : null}
        </div>
        <h1
          className="text-[clamp(2rem,4.5vw,3.25rem)] font-medium leading-[1.02] tracking-[-0.02em]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
        >
          {recipe.title}
        </h1>
        {recipe.description ? (
          <p className="max-w-2xl text-base text-[var(--ink-muted)] md:text-lg">
            {recipe.description}
          </p>
        ) : null}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--paper-sunken)] px-2.5 py-0.5 text-[11px] text-[var(--ink-muted)]"
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      {/* ACTION BAR - primary, secondary, then destructive separately */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          href={`/recipes/${recipe.id}/cook`}
          variant="primary"
          size="lg"
          hapticIntensity="medium"
        >
          Cook this
        </Button>
        <Button href={`/recipes/${recipe.id}/edit`} variant="secondary" size="lg">
          Edit
        </Button>
        <Button onClick={handleFork} variant="ghost" size="lg">
          Fork
        </Button>
        <Button
          onClick={recipe.isPublic ? handleUnshare : handleShare}
          variant="ghost"
          size="lg"
        >
          {recipe.isPublic ? "Unshare" : "Share"}
        </Button>
        <div className="ml-auto">
          <Button
            onClick={handleDelete}
            variant="destructive"
            size="lg"
            hapticIntensity="heavy"
            aria-label="Delete this recipe"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* SHARE URL */}
      {shareUrl ? (
        <Card tone="accent" padding="md">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow text-[var(--accent-deep)]">Public link</p>
              <p className="mt-1 truncate text-sm text-[var(--ink)]">{shareUrl}</p>
            </div>
            <Button onClick={copyShare} variant="secondary" size="sm">
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </Card>
      ) : null}

      {/* META + NUTRITION (skip cards if empty) */}
      {metaItems.length > 0 || nutritionEntries.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {metaItems.length > 0 ? (
            <Card tone="base" padding="lg">
              <p className="eyebrow mb-3">At a glance</p>
              <StatGrid items={metaItems} />
              <div className="ink-divider mt-5" />
              <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-soft)]">
                <span>Version {recipe.version ?? 1}</span>
                <Link
                  href={`/recipes/${recipe.id}/history`}
                  className="font-semibold text-[var(--accent-deep)] hover:underline"
                >
                  View history →
                </Link>
              </div>
            </Card>
          ) : null}
          {nutritionEntries.length > 0 ? (
            <Card tone="base" padding="lg">
              <p className="eyebrow mb-3">Nutrition (estimated)</p>
              <dl>
                {nutritionEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-baseline justify-between gap-3 border-b border-dashed border-[var(--rule)] py-2.5 last:border-b-0"
                  >
                    <dt className="text-sm text-[var(--ink-muted)] capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </dt>
                    <dd className="text-sm tabular font-medium">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* MAIN: scan + digital recipe, side by side. Each only rendered if it has content. */}
      <div className="grid gap-5 md:grid-cols-2 md:gap-7">
        {scans.length > 0 ? (
          <Card tone="paper" padding="lg">
            <p className="eyebrow mb-4">Original scan</p>
            <div className="grid gap-4">
              {scans.map((url, i) => (
                <div key={url} className="scan-frame scan-shadow">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${recipe.title}, scan ${i + 1}`}
                    className="w-full"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {ingredients.length > 0 || steps.length > 0 ? (
          <Card tone="base" padding="lg" className={scans.length === 0 ? "md:col-span-2" : ""}>
            <p className="eyebrow mb-4">Digital recipe</p>
            {ingredients.length > 0 ? (
              <>
                <h3
                  className="text-xl font-medium leading-tight"
                  style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 36" }}
                >
                  Ingredients
                </h3>
                <ul className="mt-3 grid gap-2">
                  {ingredients.map((ingredient, index) => (
                    <li
                      key={`${ingredient.name}-${index}`}
                      className="flex items-start gap-3 border-b border-dashed border-[var(--rule)] pb-2 text-sm text-[var(--ink)] last:border-b-0 last:pb-0"
                    >
                      <span
                        className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]"
                        aria-hidden="true"
                      />
                      <span>{formatIngredient(ingredient)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            {steps.length > 0 ? (
              <>
                <h3
                  className="mt-6 text-xl font-medium leading-tight"
                  style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 36" }}
                >
                  Steps
                </h3>
                <ol className="mt-3 grid gap-4">
                  {steps.map((step, index) => (
                    <li key={`${step.instruction}-${index}`} className="flex gap-3 text-sm leading-relaxed text-[var(--ink)]">
                      <span
                        className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-paper)] text-[12px] font-semibold text-[var(--accent-deep)] tabular"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <span>
                        {step.instruction}
                        {step.timerSeconds ? (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-[var(--rule)] px-2 py-0.5 text-[11px] text-[var(--ink-muted)] tabular">
                            ⏱ {Math.round(step.timerSeconds / 60)} min
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            ) : null}
          </Card>
        ) : null}
      </div>

      {/* If nothing about the recipe is filled out beyond the title, suggest editing */}
      {ingredients.length === 0 && steps.length === 0 && scans.length === 0 ? (
        <EmptyState
          tone="paper"
          icon={<BookIcon size={22} />}
          title="This recipe is empty"
          description="Add ingredients, steps, or upload a scan to bring it to life."
          action={
            <Button href={`/recipes/${recipe.id}/edit`} variant="primary">
              Edit recipe
            </Button>
          }
        />
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-input)] border border-[var(--oxblood)]/30 bg-[var(--oxblood-soft)]/40 px-4 py-3 text-sm font-medium text-[var(--oxblood)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
