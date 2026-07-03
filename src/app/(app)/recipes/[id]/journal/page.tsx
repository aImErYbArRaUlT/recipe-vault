"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-shell";
import { HeartIcon } from "@/components/ui/icon";
import { cn } from "@/components/ui/cn";
import { haptic } from "@/components/ui/haptics";

type CookLog = {
  id: string;
  cookedAt: string;
  rating?: number | null;
  notes?: string | null;
  wouldMakeAgain?: boolean | null;
};

interface RecipeJournalPageProps {
  params: Promise<{ id: string }>;
}

export default function RecipeJournalPage({ params }: RecipeJournalPageProps) {
  const { id } = use(params);
  const [logs, setLogs] = useState<CookLog[] | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [wouldMakeAgain, setWouldMakeAgain] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/recipes/${id}/logs`)
      .then((res) => res.json())
      .then((data) => setLogs(data.logs ?? []))
      .catch(() => {
        setError("Failed to load cook logs.");
        setLogs([]);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch(`/api/recipes/${id}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: rating ?? undefined,
        notes: notes || undefined,
        wouldMakeAgain,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to save log.");
      setSaving(false);
      return;
    }

    const data = await res.json();
    setLogs((prev) => [data, ...(prev ?? [])]);
    setRating(null);
    setNotes("");
    setWouldMakeAgain(false);
    setSaving(false);
    void haptic("success");
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Tried This"
        title="Cook journal"
        subtitle="A living history of every time you've made this recipe."
      />

      <Card tone="base" padding="lg">
        <p className="eyebrow mb-3">Log a new cook</p>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <fieldset className="grid gap-2">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Rating
            </legend>
            <div role="radiogroup" aria-label="Rating" className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const selected = rating === star;
                return (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setRating(star);
                      void haptic("select");
                    }}
                    className={cn(
                      "h-12 w-12 rounded-full border-2 text-base font-semibold tabular transition-colors",
                      selected
                        ? "border-[var(--accent-deep)] bg-[var(--accent)] text-white"
                        : "border-[var(--rule)] bg-[var(--surface-raised)] text-[var(--ink-soft)] hover:border-[var(--rule-strong)]",
                    )}
                  >
                    {star}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Textarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it go? Tips for next time?"
            optional
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-input)] border border-[var(--rule)] bg-[var(--paper)] px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={wouldMakeAgain}
              onChange={(e) => setWouldMakeAgain(e.target.checked)}
              className="h-5 w-5 rounded border-[var(--rule)] accent-[var(--accent)]"
            />
            <span>Would make again</span>
          </label>

          {error ? (
            <p className="text-sm font-medium text-[var(--oxblood)]">{error}</p>
          ) : null}

          <div>
            <Button
              type="submit"
              loading={saving}
              variant="primary"
              size="lg"
              hapticIntensity="success"
            >
              Log cook
            </Button>
          </div>
        </form>
      </Card>

      {/* History */}
      <section>
        <p className="eyebrow mb-3">History</p>
        {logs === null ? (
          <div className="grid gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full !rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            tone="paper"
            icon={<HeartIcon size={20} />}
            title="No cooks logged yet"
            description="Log your first attempt above. Track ratings, notes, and modifications over time."
          />
        ) : (
          <div className="grid gap-3">
            {logs.map((log) => (
              <Card key={log.id} tone="base" padding="md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[var(--ink-soft)] tabular">
                      {new Date(log.cookedAt).toLocaleDateString(undefined, {
                        dateStyle: "long",
                      })}
                    </p>
                    {log.rating ? (
                      <p className="mt-1 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            aria-hidden="true"
                            className={i < log.rating! ? "text-[var(--accent-deep)]" : "text-[var(--rule)]"}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-1.5 text-xs text-[var(--ink-muted)] tabular">
                          {log.rating} / 5
                        </span>
                      </p>
                    ) : null}
                  </div>
                  {log.wouldMakeAgain ? (
                    <Badge tone="moss" dot>
                      Would make again
                    </Badge>
                  ) : null}
                </div>
                {log.notes ? (
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ink)]">{log.notes}</p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
