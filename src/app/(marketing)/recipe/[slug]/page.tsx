import { getPublicRecipe } from "@/lib/middleware/data-access";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatGrid } from "@/components/ui/stat";
import { BookIcon } from "@/components/ui/icon";

interface PublicRecipePageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicRecipePage({ params }: PublicRecipePageProps) {
  const { slug } = await params;
  const recipe = await getPublicRecipe(slug);

  if (!recipe) {
    return (
      <EmptyState
        icon={<BookIcon size={22} />}
        title="Recipe not found"
        description="This recipe may have been removed or is no longer public."
        action={
          <Button href="/" variant="primary">
            Back home
          </Button>
        }
      />
    );
  }

  const ingredients = (Array.isArray(recipe.ingredients) ? recipe.ingredients : []) as Array<Record<string, unknown>>;
  const steps = (Array.isArray(recipe.steps) ? recipe.steps : []) as Array<Record<string, unknown>>;

  const stats = [
    recipe.prepTimeMinutes ? { label: "Prep", value: `${recipe.prepTimeMinutes} min` } : null,
    recipe.cookTimeMinutes ? { label: "Cook", value: `${recipe.cookTimeMinutes} min` } : null,
    recipe.totalTimeMinutes ? { label: "Total", value: `${recipe.totalTimeMinutes} min` } : null,
    recipe.servings ? { label: "Servings", value: String(recipe.servings) } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <article className="grid gap-8">
      {/* Title block */}
      <header className="grid gap-3 reveal reveal-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">Shared recipe</Badge>
          {recipe.cuisine ? <Badge tone="neutral">{String(recipe.cuisine)}</Badge> : null}
          {recipe.difficulty ? <Badge tone="neutral">{String(recipe.difficulty)}</Badge> : null}
        </div>
        <h1
          className="text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.02em]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
        >
          {recipe.title}
        </h1>
        {recipe.description ? (
          <p className="max-w-2xl text-base text-[var(--ink-muted)] md:text-lg">
            {recipe.description}
          </p>
        ) : null}
      </header>

      {stats.length > 0 ? <StatGrid items={stats} /> : null}

      <div className="grid gap-6 md:grid-cols-2">
        {ingredients.length > 0 ? (
          <Card tone="base" padding="lg" className="reveal reveal-2">
            <p className="eyebrow mb-3">Ingredients</p>
            <ul className="grid gap-2">
              {ingredients.map((ing, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 border-b border-dashed border-[var(--rule)] pb-2 text-sm last:border-b-0 last:pb-0"
                >
                  <span
                    className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]"
                    aria-hidden="true"
                  />
                  <span>
                    {ing.quantity ? `${ing.quantity} ` : ""}
                    {ing.unit ? `${ing.unit} ` : ""}
                    {String(ing.name ?? "")}
                    {ing.preparation ? `, ${ing.preparation}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {steps.length > 0 ? (
          <Card tone="base" padding="lg" className="reveal reveal-3">
            <p className="eyebrow mb-3">Steps</p>
            <ol className="grid gap-4">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-paper)] text-[12px] font-semibold text-[var(--accent-deep)] tabular"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span>{String(step.instruction ?? "")}</span>
                </li>
              ))}
            </ol>
          </Card>
        ) : null}
      </div>

      {/* CTA */}
      <Card tone="accent" padding="xl" className="reveal reveal-4 text-center">
        <p className="eyebrow text-[var(--accent-deep)]">Build your own vault</p>
        <h2
          className="mx-auto mt-3 max-w-xl text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-tight"
          style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
        >
          Save this recipe, tweak it, cook it hands-free with voice.
        </h2>
        <div className="mt-5 inline-flex">
          <Button href="/signup" variant="primary" size="xl">
            Start 3-day free trial
          </Button>
        </div>
      </Card>
    </article>
  );
}
