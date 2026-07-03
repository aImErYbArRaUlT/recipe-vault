"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useCookbooksStore } from "@/lib/stores/cookbooks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/sheet";
import { PageHeader } from "@/components/ui/page-shell";
import { BookIcon, PlusIcon } from "@/components/ui/icon";

type Cookbook = {
  id: string;
  title: string;
  description?: string | null;
};

type Recipe = {
  id: string;
  title: string;
  description?: string | null;
};

interface CookbookPageProps {
  params: Promise<{ id: string }>;
}

export default function CookbookPage({ params }: CookbookPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const confirm = useConfirm();
  const updateCookbook = useCookbooksStore((s) => s.update);
  const removeCookbook = useCookbooksStore((s) => s.remove);
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [savedDetails, setSavedDetails] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/cookbooks/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCookbook(data);
        setEditingTitle(data.title ?? "");
        setEditingDescription(data.description ?? "");
      })
      .catch(() => setError("Failed to load cookbook."));

    fetch(`/api/cookbooks/${id}/recipes`)
      .then((res) => res.json())
      .then((data) => setRecipes(data.recipes ?? []))
      .catch(() => setRecipes([]));

    fetch("/api/recipes")
      .then((res) => res.json())
      .then((data) => setAllRecipes(Array.isArray(data) ? data : []))
      .catch(() => null);
  }, [id]);

  const availableRecipes = allRecipes.filter(
    (r) => !(recipes ?? []).some((existing) => existing.id === r.id),
  );

  async function handleAddRecipe() {
    if (!selectedRecipe) return;
    setError("");
    const res = await fetch(`/api/cookbooks/${id}/recipes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: selectedRecipe }),
    });
    if (!res.ok) {
      setError("Failed to add recipe.");
      return;
    }
    const data = await res.json();
    setRecipes((prev) => [data, ...(prev ?? [])]);
    setSelectedRecipe("");
  }

  async function handleRemoveRecipe(recipeId: string, title: string) {
    const ok = await confirm({
      title: `Remove "${title}" from this cookbook?`,
      description: "The recipe stays in your vault. It's only being removed from this cookbook.",
      confirmLabel: "Remove",
      tone: "destructive",
    });
    if (!ok) return;
    const res = await fetch(`/api/cookbooks/${id}/recipes/${recipeId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError("Failed to remove recipe.");
      return;
    }
    setRecipes((prev) => (prev ?? []).filter((recipe) => recipe.id !== recipeId));
  }

  async function handleSaveDetails() {
    setSavingDetails(true);
    const res = await fetch(`/api/cookbooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editingTitle,
        description: editingDescription || null,
      }),
    });
    setSavingDetails(false);
    if (!res.ok) {
      setError("Failed to update cookbook.");
      return;
    }
    const data = await res.json();
    setCookbook(data);
    updateCookbook(id, {
      title: data.title,
      description: data.description,
    });
    setSavedDetails(true);
    setTimeout(() => setSavedDetails(false), 1500);
  }

  async function handleDeleteCookbook() {
    const ok = await confirm({
      title: "Delete this cookbook?",
      description: "The cookbook is removed, but your recipes stay safe in your vault.",
      confirmLabel: "Delete cookbook",
      tone: "destructive",
    });
    if (!ok) return;
    const res = await fetch(`/api/cookbooks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete cookbook.");
      return;
    }
    removeCookbook(id);
    router.push("/cookbooks");
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Cookbook"
        title={cookbook?.title ?? "Loading…"}
        subtitle={cookbook?.description ?? undefined}
        action={
          <Button onClick={handleDeleteCookbook} variant="destructive" size="md">
            Delete
          </Button>
        }
      />

      {/* Details */}
      <Card tone="base" padding="lg">
        <p className="eyebrow mb-3">Details</p>
        <div className="grid gap-4">
          <Input
            label="Title"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
          />
          <Textarea
            label="Description"
            value={editingDescription}
            onChange={(e) => setEditingDescription(e.target.value)}
            optional
          />
          <div>
            <Button
              onClick={handleSaveDetails}
              loading={savingDetails}
              variant="secondary"
              size="md"
            >
              {savedDetails ? "Saved ✓" : "Save details"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Add recipe (only show if there's anything to add) */}
      {availableRecipes.length > 0 ? (
        <Card tone="base" padding="lg">
          <p className="eyebrow mb-3">Add recipe</p>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <Select
              label="Recipe"
              value={selectedRecipe}
              onChange={(e) => setSelectedRecipe(e.target.value)}
            >
              <option value="">Choose one…</option>
              {availableRecipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.title}
                </option>
              ))}
            </Select>
            <Button
              onClick={handleAddRecipe}
              disabled={!selectedRecipe}
              variant="primary"
              size="lg"
              leading={<PlusIcon size={14} />}
            >
              Add
            </Button>
          </div>
        </Card>
      ) : null}

      {/* List */}
      <section>
        <p className="eyebrow mb-3">Recipes in this cookbook</p>
        {recipes === null ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full !rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <EmptyState
            tone="paper"
            icon={<BookIcon size={20} />}
            title="No recipes here yet"
            description="Add one from above or from any recipe's detail page."
          />
        ) : (
          <div className="grid gap-3">
            {recipes.map((recipe) => (
              <Card
                key={recipe.id}
                tone="base"
                padding="md"
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="text-base font-semibold hover:underline"
                  >
                    {recipe.title}
                  </Link>
                  {recipe.description ? (
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">{recipe.description}</p>
                  ) : null}
                </div>
                <Button
                  onClick={() => handleRemoveRecipe(recipe.id, recipe.title)}
                  variant="ghost"
                  size="sm"
                >
                  Remove
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {error ? (
        <p className="rounded-[var(--radius-input)] border border-[var(--oxblood)]/30 bg-[var(--oxblood-soft)]/40 px-4 py-3 text-sm font-medium text-[var(--oxblood)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
