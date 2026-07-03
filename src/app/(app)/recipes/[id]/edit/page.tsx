"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useRecipesStore } from "@/lib/stores/recipes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-shell";
import { PlusIcon } from "@/components/ui/icon";

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

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const invalidateRecipes = useRecipesStore((s) => s.invalidate);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: "" }]);
  const [steps, setSteps] = useState<Step[]>([{ instruction: "" }]);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number | "">("");
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number | "">("");
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number | "">("");
  const [servings, setServings] = useState<number | "">(4);
  const [cuisine, setCuisine] = useState("");
  const [tags, setTags] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/recipes/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setIngredients(data.ingredients?.length ? data.ingredients : [{ name: "" }]);
        setSteps(data.steps?.length ? data.steps : [{ instruction: "" }]);
        setPrepTimeMinutes(data.prepTimeMinutes ?? "");
        setCookTimeMinutes(data.cookTimeMinutes ?? "");
        setTotalTimeMinutes(data.totalTimeMinutes ?? "");
        setServings(data.servings ?? 4);
        setCuisine(data.cuisine ?? "");
        setTags((data.tags ?? []).join(", "));
        setDifficulty(data.difficulty ?? "");
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load recipe.");
        setLoading(false);
      });
  }, [id]);

  function updateIngredient(index: number, patch: Partial<Ingredient>) {
    setIngredients((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function updateStep(index: number, patch: Partial<Step>) {
    setSteps((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      title,
      description: description || undefined,
      ingredients: ingredients.filter((item) => item.name.trim().length > 0),
      steps: steps.filter((item) => item.instruction.trim().length > 0),
      prepTimeMinutes: prepTimeMinutes === "" ? null : prepTimeMinutes,
      cookTimeMinutes: cookTimeMinutes === "" ? null : cookTimeMinutes,
      totalTimeMinutes: totalTimeMinutes === "" ? null : totalTimeMinutes,
      servings: servings === "" ? null : servings,
      cuisine: cuisine || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      difficulty: difficulty || null,
      changesSummary: "Recipe updated",
    };

    const res = await fetch(`/api/recipes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to update recipe.");
      setSaving(false);
      return;
    }

    invalidateRecipes();
    router.push(`/recipes/${id}`);
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        <PageHeader eyebrow="Editing" title="Loading…" />
        <Skeleton className="h-72 w-full !rounded-[var(--radius-card-lg)]" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Editing" title="Edit recipe" />

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <Card tone="base" padding="lg">
          <p className="eyebrow mb-3">Basics</p>
          <div className="grid gap-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              optional
            />
          </div>
        </Card>

        <Card tone="base" padding="lg">
          <p className="eyebrow mb-3">Ingredients</p>
          <div className="grid gap-3">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_1.5fr]">
                <Input
                  label={index === 0 ? "Ingredient" : ""}
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(index, { name: e.target.value })}
                />
                <Input
                  label={index === 0 ? "Qty" : ""}
                  type="number"
                  inputMode="numeric"
                  value={ingredient.quantity ?? ""}
                  onChange={(e) =>
                    updateIngredient(index, {
                      quantity: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
                <Input
                  label={index === 0 ? "Unit" : ""}
                  value={ingredient.unit ?? ""}
                  onChange={(e) => updateIngredient(index, { unit: e.target.value })}
                />
                <Input
                  label={index === 0 ? "Prep" : ""}
                  value={ingredient.preparation ?? ""}
                  onChange={(e) => updateIngredient(index, { preparation: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={() => setIngredients((prev) => [...prev, { name: "" }])}
              variant="secondary"
              size="sm"
              leading={<PlusIcon size={14} />}
            >
              Add ingredient
            </Button>
            {ingredients.length > 1 ? (
              <Button
                onClick={() => setIngredients((prev) => prev.slice(0, -1))}
                variant="ghost"
                size="sm"
              >
                Remove last
              </Button>
            ) : null}
          </div>
        </Card>

        <Card tone="base" padding="lg">
          <p className="eyebrow mb-3">Steps</p>
          <div className="grid gap-3">
            {steps.map((step, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[1fr_140px]">
                <Textarea
                  label={`Step ${index + 1}`}
                  value={step.instruction}
                  onChange={(e) => updateStep(index, { instruction: e.target.value })}
                  className="min-h-[80px]"
                />
                <Input
                  label="Timer (sec)"
                  type="number"
                  inputMode="numeric"
                  value={step.timerSeconds ?? ""}
                  onChange={(e) =>
                    updateStep(index, {
                      timerSeconds: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  optional
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={() => setSteps((prev) => [...prev, { instruction: "" }])}
              variant="secondary"
              size="sm"
              leading={<PlusIcon size={14} />}
            >
              Add step
            </Button>
            {steps.length > 1 ? (
              <Button
                onClick={() => setSteps((prev) => prev.slice(0, -1))}
                variant="ghost"
                size="sm"
              >
                Remove last
              </Button>
            ) : null}
          </div>
        </Card>

        <Card tone="base" padding="lg">
          <p className="eyebrow mb-3">Details</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Prep (min)"
              type="number"
              inputMode="numeric"
              value={prepTimeMinutes}
              onChange={(e) => setPrepTimeMinutes(e.target.value ? Number(e.target.value) : "")}
              optional
            />
            <Input
              label="Cook (min)"
              type="number"
              inputMode="numeric"
              value={cookTimeMinutes}
              onChange={(e) => setCookTimeMinutes(e.target.value ? Number(e.target.value) : "")}
              optional
            />
            <Input
              label="Total (min)"
              type="number"
              inputMode="numeric"
              value={totalTimeMinutes}
              onChange={(e) => setTotalTimeMinutes(e.target.value ? Number(e.target.value) : "")}
              optional
            />
            <Input
              label="Servings"
              type="number"
              inputMode="numeric"
              value={servings}
              onChange={(e) => setServings(e.target.value ? Number(e.target.value) : "")}
              optional
            />
            <Input
              label="Cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              optional
            />
            <Select
              label="Difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              optional
            >
              <option value="">None</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
            <div className="md:col-span-3">
              <Input
                label="Tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="breakfast, quick, family"
                hint="Comma separated"
                optional
              />
            </div>
          </div>
        </Card>

        {error ? (
          <p className="rounded-[var(--radius-input)] border border-[var(--oxblood)]/30 bg-[var(--oxblood-soft)]/40 px-4 py-3 text-sm font-medium text-[var(--oxblood)]">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            disabled={saving || !title.trim()}
            loading={saving}
            variant="primary"
            size="lg"
            hapticIntensity="success"
          >
            Update recipe
          </Button>
          <Button onClick={() => router.push(`/recipes/${id}`)} variant="ghost" size="lg">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
