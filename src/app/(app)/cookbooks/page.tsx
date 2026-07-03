"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/stores/user";
import { useCookbooksStore } from "@/lib/stores/cookbooks";
import { COOKBOOK_LIMITS } from "@/lib/config/plans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionIcon, PlusIcon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-shell";

export default function CookbooksPage() {
  const cookbooks = useCookbooksStore((s) => s.cookbooks);
  const ensureLoaded = useCookbooksStore((s) => s.ensureLoaded);
  const addCookbook = useCookbooksStore((s) => s.add);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState("");
  const planId = useUserStore((s) => s.user?.planId ?? null);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setStatus("saving");
    setError("");

    const res = await fetch("/api/cookbooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to create cookbook.");
      setStatus("idle");
      return;
    }

    const data = await res.json();
    addCookbook(data);
    setTitle("");
    setStatus("idle");
  }

  const list = cookbooks ?? [];
  const planKey = (planId ?? "free") as keyof typeof COOKBOOK_LIMITS;
  const planLimit = COOKBOOK_LIMITS[planKey];
  const limitReached =
    planLimit !== null && planLimit !== undefined && list.length >= planLimit;
  const isFreeOrHome = planId === "free" || planId === "home";

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Collections"
        title="Cookbooks"
        subtitle={
          list.length > 0
            ? `${list.length} ${list.length === 1 ? "cookbook" : "cookbooks"} in your vault.`
            : undefined
        }
      />

      {/* Create form */}
      <Card tone="base" padding="md">
        <form
          onSubmit={handleCreate}
          className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end"
        >
          <Input
            label="New cookbook"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Weeknight Italian"
            disabled={limitReached}
          />
          <Button
            type="submit"
            disabled={status === "saving" || limitReached || !title.trim()}
            loading={status === "saving"}
            variant="primary"
            size="lg"
            leading={<PlusIcon size={16} />}
            hapticIntensity="medium"
          >
            Create
          </Button>
          {limitReached && isFreeOrHome ? (
            <p className="rounded-[var(--radius-input)] bg-[var(--mustard-soft)] px-4 py-2.5 text-xs text-[var(--mustard)] md:col-span-2">
              {planId === "free"
                ? "Free plan is limited to 2 cookbooks."
                : "Home plan is limited to 3 cookbooks."}{" "}
              <Link href="/settings/billing" className="font-semibold underline-offset-2 hover:underline">
                Upgrade to Pro
              </Link>{" "}
              for unlimited.
            </p>
          ) : null}
          {error ? (
            <p className="text-sm font-medium text-[var(--oxblood)] md:col-span-2">{error}</p>
          ) : null}
        </form>
      </Card>

      {/* List */}
      {cookbooks === null ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full !rounded-[var(--radius-card-lg)]" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          tone="paper"
          icon={<CollectionIcon size={22} />}
          title="No cookbooks yet"
          description="Cookbooks let you group recipes by theme: weeknights, holidays, Nonna's. Create your first above."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((cookbook) => (
            <Link
              key={cookbook.id}
              href={`/cookbooks/${cookbook.id}`}
              className="group flex flex-col gap-3 rounded-[var(--radius-card-lg)] border border-[var(--rule)] bg-[var(--surface)] p-6 shadow-[var(--shadow-emboss)] transition-shadow hover:shadow-[var(--shadow-raised)]"
            >
              <div className="flex items-start justify-between gap-3">
                <CollectionIcon size={22} className="text-[var(--accent-deep)]" />
                {cookbook.isShared ? <Badge tone="moss" dot>Shared</Badge> : null}
              </div>
              <h3
                className="text-xl font-medium leading-tight"
                style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 36" }}
              >
                {cookbook.title}
              </h3>
              {cookbook.description ? (
                <p className="text-sm text-[var(--ink-muted)]">{cookbook.description}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
