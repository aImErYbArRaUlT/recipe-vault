"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRecipesStore } from "@/lib/stores/recipes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-shell";
import { SparkleIcon } from "@/components/ui/icon";

interface ScanJob {
  id: string;
  status: string;
  parsedRecipe: {
    title?: string;
    description?: string;
    ingredients?: Array<{ name: string; quantity?: number; unit?: string; preparation?: string }>;
    steps?: Array<{ instruction: string; timer_seconds?: number }>;
    prep_time_minutes?: number;
    cook_time_minutes?: number;
    total_time_minutes?: number;
    servings?: number;
    cuisine?: string;
    tags?: string[];
    difficulty?: string;
  } | null;
  thumbnailUrl?: string | null;
  errorMessage?: string | null;
  imageUrls?: string[] | null;
}

interface Overrides {
  title: string;
  description: string;
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  totalTimeMinutes: string;
  servings: string;
  cuisine: string;
  difficulty: string;
  tags: string;
}

function statusLabel(status: string) {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Reading recipe…";
    case "completed":
      return "Ready to review";
    case "failed":
      return "Couldn't read it";
    default:
      return status;
  }
}

function statusTone(status: string): "accent" | "moss" | "mustard" | "oxblood" {
  switch (status) {
    case "completed":
      return "moss";
    case "failed":
      return "oxblood";
    case "processing":
    case "queued":
      return "mustard";
    default:
      return "accent";
  }
}

export default function ScanReviewPage() {
  return (
    <Suspense fallback={<ScanReviewSkeleton />}>
      <ScanReviewContent />
    </Suspense>
  );
}

function ScanReviewSkeleton() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-72 w-full !rounded-[var(--radius-card-lg)]" />
    </div>
  );
}

function ScanReviewContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const invalidateRecipes = useRecipesStore((s) => s.invalidate);
  const [job, setJob] = useState<ScanJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Overrides | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const load = async () => {
      const response = await fetch(`/api/scan/${jobId}`);
      if (!response.ok) {
        setError("Unable to load scan");
        return;
      }
      const data = (await response.json()) as ScanJob;
      setJob(data);
      if (data.parsedRecipe && !overrides) {
        const r = data.parsedRecipe;
        setOverrides({
          title: r.title ?? "",
          description: r.description ?? "",
          prepTimeMinutes: r.prep_time_minutes ? String(r.prep_time_minutes) : "",
          cookTimeMinutes: r.cook_time_minutes ? String(r.cook_time_minutes) : "",
          totalTimeMinutes: r.total_time_minutes ? String(r.total_time_minutes) : "",
          servings: r.servings ? String(r.servings) : "",
          cuisine: r.cuisine ?? "",
          difficulty: r.difficulty ?? "",
          tags: (r.tags ?? []).join(", "),
        });
      }
    };

    load();
    const interval = window.setInterval(load, 2500);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const update = (field: keyof Overrides, value: string) => {
    setOverrides((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const onConfirm = async () => {
    if (!jobId) return;
    setBusy(true);
    const response = await fetch(`/api/scan/${jobId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overrides: overrides ?? {} }),
    });
    if (!response.ok) {
      setError("Scan not ready yet");
      setBusy(false);
      return;
    }
    const data = await response.json();
    setBusy(false);
    if (data?.id) {
      invalidateRecipes();
      window.location.href = `/recipes/${data.id}`;
    }
  };

  const onRetry = async () => {
    if (!job?.imageUrls?.length) return;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrls: job.imageUrls }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("Retry failed. Try again.");
      return;
    }
    const data = await response.json();
    if (data?.id) {
      window.location.href = `/scan/review?jobId=${data.id}`;
    }
  };

  const ingredients = job?.parsedRecipe?.ingredients ?? [];
  const steps = job?.parsedRecipe?.steps ?? [];

  if (!jobId) {
    return (
      <EmptyState
        title="No scan job"
        description="This page expects a scan job ID."
        action={<Button href="/scan" variant="primary">Start a scan</Button>}
      />
    );
  }

  if (!job || !overrides) {
    return (
      <div className="grid gap-6">
        <PageHeader eyebrow="Reviewing" title="Reading your recipe…" />
        <Card tone="base" padding="lg">
          <div className="grid gap-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Review"
        title="Confirm what we read"
        subtitle="Edit any field below. Empty fields are skipped. Nothing fake is saved."
        action={<Badge tone={statusTone(job.status)} dot>{statusLabel(job.status)}</Badge>}
      />

      {job.status === "failed" ? (
        <Card tone="base" padding="lg" className="border-[var(--oxblood)]/30">
          <p className="eyebrow text-[var(--oxblood)]">Scan failed</p>
          <p className="mt-2 text-base text-[var(--ink)]">
            {job.errorMessage ??
              "We couldn't read this clearly. Try a brighter photo, flatter angle, or fewer pages at once."}
          </p>
          {job.imageUrls?.length ? (
            <div className="mt-4">
              <Button onClick={onRetry} disabled={busy} loading={busy} variant="primary">
                Retry scan
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Top: thumbnail + status */}
      {job.thumbnailUrl ? (
        <div className="flex items-start gap-4">
          <div className="scan-frame scan-shadow w-32 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={job.thumbnailUrl}
              alt="Scan thumbnail"
              className="w-full"
              loading="lazy"
            />
          </div>
          <p className="text-sm text-[var(--ink-muted)]">
            We&apos;ve preserved your original. The edits below only affect the
            digital recipe. Your scan stays as-is.
          </p>
        </div>
      ) : null}

      {/* Form */}
      <Card tone="base" padding="lg">
        <div className="grid gap-5">
          <Input
            label="Title"
            value={overrides.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Sunday sauce"
            required
          />
          <Textarea
            label="Description"
            value={overrides.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="A short note about this recipe…"
            optional
          />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Input
              label="Prep (min)"
              type="number"
              inputMode="numeric"
              value={overrides.prepTimeMinutes}
              onChange={(e) => update("prepTimeMinutes", e.target.value)}
              placeholder=""
              optional
            />
            <Input
              label="Cook (min)"
              type="number"
              inputMode="numeric"
              value={overrides.cookTimeMinutes}
              onChange={(e) => update("cookTimeMinutes", e.target.value)}
              placeholder=""
              optional
            />
            <Input
              label="Total (min)"
              type="number"
              inputMode="numeric"
              value={overrides.totalTimeMinutes}
              onChange={(e) => update("totalTimeMinutes", e.target.value)}
              placeholder=""
              optional
            />
            <Input
              label="Servings"
              type="number"
              inputMode="numeric"
              value={overrides.servings}
              onChange={(e) => update("servings", e.target.value)}
              placeholder=""
              optional
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Cuisine"
              value={overrides.cuisine}
              onChange={(e) => update("cuisine", e.target.value)}
              placeholder="Italian"
              optional
            />
            <Select
              label="Difficulty"
              value={overrides.difficulty}
              onChange={(e) => update("difficulty", e.target.value)}
              optional
            >
              <option value="">None</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
          </div>

          <Input
            label="Tags"
            value={overrides.tags}
            onChange={(e) => update("tags", e.target.value)}
            placeholder="breakfast, quick, family"
            hint="Comma separated"
            optional
          />
        </div>
      </Card>

      {/* Parsed content preview - only if present */}
      {ingredients.length > 0 || steps.length > 0 ? (
        <Card tone="paper" padding="lg">
          <p className="eyebrow mb-3">What we read</p>
          {ingredients.length > 0 ? (
            <>
              <h3
                className="text-xl font-medium leading-tight"
                style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 36" }}
              >
                Ingredients
              </h3>
              <ul className="mt-2 grid gap-1.5 text-sm">
                {ingredients.map((ingredient, index) => (
                  <li
                    key={`${ingredient.name}-${index}`}
                    className="flex items-start gap-2"
                  >
                    <span
                      className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]"
                      aria-hidden="true"
                    />
                    <span>
                      {ingredient.quantity ? `${ingredient.quantity} ` : ""}
                      {ingredient.unit ? `${ingredient.unit} ` : ""}
                      {ingredient.name}
                      {ingredient.preparation ? `, ${ingredient.preparation}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {steps.length > 0 ? (
            <>
              <h3
                className="mt-5 text-xl font-medium leading-tight"
                style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 36" }}
              >
                Steps
              </h3>
              <ol className="mt-2 grid gap-3 text-sm leading-relaxed">
                {steps.map((step, index) => (
                  <li key={`step-${index}`} className="flex gap-2.5">
                    <span
                      className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-paper)] text-[11px] font-semibold text-[var(--accent-deep)] tabular"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span>{step.instruction ?? ""}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
        </Card>
      ) : job.status === "processing" || job.status === "queued" ? (
        <Card tone="base" padding="lg">
          <div className="flex items-center gap-3">
            <SparkleIcon size={18} className="text-[var(--accent-deep)]" />
            <p className="text-sm text-[var(--ink-muted)]">
              Reading your recipe… this usually takes a few seconds.
            </p>
          </div>
        </Card>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-input)] border border-[var(--oxblood)]/30 bg-[var(--oxblood-soft)]/40 px-4 py-3 text-sm font-medium text-[var(--oxblood)]">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={onConfirm}
          disabled={busy || job.status !== "completed" || !overrides.title.trim()}
          loading={busy}
          variant="primary"
          size="lg"
          hapticIntensity="success"
        >
          Save to vault
        </Button>
        {job.status === "failed" ? (
          <Button onClick={onRetry} disabled={busy} variant="secondary" size="lg">
            Retry scan
          </Button>
        ) : null}
      </div>
    </div>
  );
}
