"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRecipesStore } from "@/lib/stores/recipes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-shell";
import { PlusIcon, SparkleIcon } from "@/components/ui/icon";

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

export default function NewRecipePage() {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [showPaste, setShowPaste] = useState(false);

  function updateIngredient(index: number, patch: Partial<Ingredient>) {
    setIngredients((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function updateStep(index: number, patch: Partial<Step>) {
    setSteps((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleParse() {
    if (pasteText.trim().length < 10) return;
    setParsing(true);
    setError("");

    const res = await fetch("/api/recipes/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: pasteText }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to parse recipe.");
      setParsing(false);
      return;
    }

    const recipe = await res.json();
    if (recipe.title) setTitle(recipe.title);
    if (recipe.description) setDescription(recipe.description);
    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
      setIngredients(
        recipe.ingredients.map((i: Record<string, unknown>) => ({
          name: String(i.name ?? ""),
          quantity: typeof i.quantity === "number" ? i.quantity : undefined,
          unit: i.unit ? String(i.unit) : undefined,
          preparation: i.preparation ? String(i.preparation) : undefined,
        })),
      );
    }
    if (Array.isArray(recipe.steps) && recipe.steps.length > 0) {
      setSteps(
        recipe.steps.map((s: Record<string, unknown>) => ({
          instruction: String(s.instruction ?? ""),
          timerSeconds: typeof s.timerSeconds === "number" ? s.timerSeconds : null,
        })),
      );
    }
    if (typeof recipe.prepTimeMinutes === "number") setPrepTimeMinutes(recipe.prepTimeMinutes);
    if (typeof recipe.cookTimeMinutes === "number") setCookTimeMinutes(recipe.cookTimeMinutes);
    if (typeof recipe.totalTimeMinutes === "number") setTotalTimeMinutes(recipe.totalTimeMinutes);
    if (typeof recipe.servings === "number") setServings(recipe.servings);
    if (recipe.cuisine) setCuisine(String(recipe.cuisine));
    if (recipe.difficulty) setDifficulty(String(recipe.difficulty));
    if (Array.isArray(recipe.tags)) setTags(recipe.tags.join(", "));

    setShowPaste(false);
    setParsing(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

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
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      difficulty: difficulty || null,
    };

    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to create recipe.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    invalidateRecipes();
    router.push(`/recipes/${data.id}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Add manually"
        title="New recipe"
        subtitle="Type it in, or paste any text and we'll structure it for you."
      />

      {/* AI paste-in */}
      {!showPaste ? (
        <Button
          onClick={() => setShowPaste(true)}
          variant="outline"
          size="lg"
          leading={<SparkleIcon size={16} />}
        >
          Paste text and let AI fill it in
        </Button>
      ) : (
        <Card tone="accent" padding="lg">
          <p className="eyebrow text-[var(--accent-deep)]">AI helper</p>
          <h3
            className="mt-2 text-xl font-medium leading-tight"
            style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 36" }}
          >
            Paste your recipe text
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            From a website, notes app, or freeform. We&apos;ll fill in the form below.
          </p>
          <div className="mt-4">
            <Textarea
              label="Recipe text"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste here…"
              className="min-h-[180px]"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={handleParse}
              disabled={parsing || pasteText.trim().length < 10}
              loading={parsing}
              variant="primary"
              size="md"
              leading={<SparkleIcon size={14} />}
            >
              {parsing ? "Reading…" : "Parse with AI"}
            </Button>
            <Button onClick={() => setShowPaste(false)} variant="secondary" size="md">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <form className="grid gap-6" onSubmit={handleSubmit}>
        {/* Basics */}
        <Card tone="base" padding="lg">
          <p className="eyebrow mb-3">Basics</p>
          <div className="grid gap-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Sunday sauce"
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A note about this recipe…"
              optional
            />
          </div>
        </Card>

        {/* Ingredients */}
        <Card tone="base" padding="lg">
          <p className="eyebrow mb-3">Ingredients</p>
          <div className="grid gap-3">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_1.5fr]">
                <Input
                  label={index === 0 ? "Ingredient" : ""}
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(index, { name: e.target.value })}
                  placeholder="Tomatoes"
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
                  placeholder="2"
                />
                <Input
                  label={index === 0 ? "Unit" : ""}
                  value={ingredient.unit ?? ""}
                  onChange={(e) => updateIngredient(index, { unit: e.target.value })}
                  placeholder="cups"
                />
                <Input
                  label={index === 0 ? "Prep" : ""}
                  value={ingredient.preparation ?? ""}
                  onChange={(e) => updateIngredient(index, { preparation: e.target.value })}
                  placeholder="diced"
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

        {/* Steps */}
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
                  placeholder="Heat the oil, add the garlic…"
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
                  placeholder=""
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

        {/* Details */}
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
              placeholder="Italian"
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
            disabled={loading || !title.trim()}
            loading={loading}
            variant="primary"
            size="lg"
            hapticIntensity="success"
          >
            Save recipe
          </Button>
          <Button onClick={() => router.back()} variant="ghost" size="lg">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
