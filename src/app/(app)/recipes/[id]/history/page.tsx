"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/sheet";
import { PageHeader } from "@/components/ui/page-shell";
import { ClockIcon } from "@/components/ui/icon";

type VersionEntry = {
  id: string;
  version: number;
  changesSummary: string;
  changedByName: string;
  createdAt: string;
};

interface RecipeHistoryPageProps {
  params: Promise<{ id: string }>;
}

export default function RecipeHistoryPage({ params }: RecipeHistoryPageProps) {
  const { id } = use(params);
  const confirm = useConfirm();
  const [versions, setVersions] = useState<VersionEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/recipes/${id}/versions`)
      .then((res) => res.json())
      .then((data) => setVersions(data.versions ?? []))
      .catch(() => {
        setError("Failed to load version history.");
        setVersions([]);
      });
  }, [id]);

  async function handleRestore(version: number) {
    const ok = await confirm({
      title: `Restore version ${version}?`,
      description: "This replaces the current recipe with the selected version. The current state will be saved as a new entry in history.",
      confirmLabel: "Restore",
      cancelLabel: "Cancel",
    });
    if (!ok) return;

    const res = await fetch(`/api/recipes/${id}/restore/${version}`, {
      method: "POST",
    });
    if (!res.ok) {
      setError("Failed to restore version.");
      return;
    }
    window.location.href = `/recipes/${id}`;
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Audit trail"
        title="Version history"
        subtitle="Every save creates a snapshot. Restore any earlier version."
      />

      {versions === null ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full !rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : versions.length === 0 ? (
        <EmptyState
          tone="paper"
          icon={<ClockIcon size={20} />}
          title="No history yet"
          description="Every time you save edits, a snapshot appears here."
        />
      ) : (
        <div className="grid gap-3">
          {versions.map((version, idx) => (
            <Card
              key={version.id}
              tone="base"
              padding="md"
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge tone={idx === 0 ? "moss" : "neutral"}>
                    v{version.version}
                    {idx === 0 ? " · current" : ""}
                  </Badge>
                  <span className="text-xs text-[var(--ink-soft)] tabular">
                    {new Date(version.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold leading-tight">{version.changesSummary}</p>
                {version.changedByName ? (
                  <p className="mt-0.5 text-xs text-[var(--ink-soft)]">by {version.changedByName}</p>
                ) : null}
              </div>
              {idx !== 0 ? (
                <Button onClick={() => handleRestore(version.version)} variant="secondary" size="sm">
                  Restore
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      {error ? (
        <p className="rounded-[var(--radius-input)] border border-[var(--oxblood)]/30 bg-[var(--oxblood-soft)]/40 px-4 py-3 text-sm font-medium text-[var(--oxblood)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
