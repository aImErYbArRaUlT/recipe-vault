"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useUserStore } from "@/lib/stores/user";
import { useRecipesStore } from "@/lib/stores/recipes";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RecipeCardSkeleton } from "@/components/ui/skeleton";
import { RecipeThumb } from "@/components/ui/recipe-thumb";
import {
  BookIcon,
  CameraIcon,
  CollectionIcon,
  PlusIcon,
  SparkleIcon,
} from "@/components/ui/icon";

export default function DashboardPage() {
  const user = useUserStore((s) => s.user);
  const recipes = useRecipesStore((s) => s.recipes);
  const ensureLoaded = useRecipesStore((s) => s.ensureLoaded);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  const recentRecipes = useMemo(() => (recipes ?? []).slice(0, 6), [recipes]);
  const trialEndsAt = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const daysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const trialEndLabel = trialEndsAt
    ? trialEndsAt.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  const greeting = user?.displayName
    ? `Welcome back, ${user.displayName.split(" ")[0]}`
    : "Welcome back";

  return (
    <div className="grid gap-8 md:gap-10">
      {/* GREETING */}
      <header className="reveal reveal-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your kitchen</p>
          <h1
            className="mt-2 text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.02] tracking-[-0.02em]"
            style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
          >
            {greeting}
          </h1>
        </div>
        {user?.planId === "trial" && daysRemaining !== null ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[var(--radius-pill)] border border-[var(--accent)]/30 bg-[var(--accent-paper)] px-4 py-2 text-sm text-[var(--accent-deep)]">
            <span className="inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
            <span className="font-semibold tabular">
              {daysRemaining === 0
                ? "Trial ends today"
                : `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} of Pro left`}
            </span>
            {trialEndLabel ? (
              <span className="text-xs text-[var(--accent-deep)]/75">
                · Ends {trialEndLabel}
              </span>
            ) : null}
            <Link
              href="/settings/billing"
              className="ml-1 font-semibold underline-offset-4 hover:underline"
            >
              Keep Pro
            </Link>
          </div>
        ) : user?.planId === "free" ? (
          <Link
            href="/settings/billing"
            className="flex items-center gap-3 rounded-full border border-[var(--rule)] bg-[var(--surface-raised)] px-4 py-2 text-sm text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent-deep)]"
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-[var(--ink-soft)]" />
            <span className="font-semibold">Free plan</span>
            <span className="text-[var(--accent-deep)]">Upgrade to Pro</span>
          </Link>
        ) : null}
      </header>

      {/* PRIMARY ACTIONS - hero scan + secondary quick actions */}
      <section className="reveal reveal-2 grid gap-4 md:grid-cols-[1.4fr_1fr] md:gap-5">
        {/* Hero: Scan a recipe */}
        <Link
          href="/scan"
          className="group relative overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--accent)]/30 bg-[var(--surface-raised)] p-6 transition-shadow hover:shadow-[var(--shadow-lifted)] md:p-8"
          style={{
            backgroundImage:
              "radial-gradient(700px 400px at 0% 100%, rgba(195,90,56,0.10), transparent 50%)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Quick start</p>
              <h2
                className="mt-3 text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-[1.05]"
                style={{ fontVariationSettings: "'opsz' 56, 'SOFT' 50" }}
              >
                Scan a recipe
              </h2>
              <p className="mt-2 max-w-sm text-sm text-[var(--ink-muted)] md:text-base">
                Snap a handwritten card or a cookbook page. We&apos;ll keep the
                original and build a clean digital recipe.
              </p>
              {/* Visual pill only - the whole card is already a link to /scan.
                  Rendered as a span so it doesn't create a nested <a>. */}
              <div className="mt-5">
                <span
                  aria-hidden="true"
                  className="inline-flex h-12 select-none items-center gap-2 rounded-full border border-[var(--accent-deep)]/40 bg-[var(--accent)] px-6 text-sm font-semibold text-white shadow-[var(--shadow-raised)] transition-transform group-hover:-translate-y-0.5"
                >
                  <CameraIcon size={18} />
                  Open camera
                </span>
              </div>
            </div>
            <div className="hidden h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-paper)] text-[var(--accent-deep)] md:flex">
              <CameraIcon size={42} />
            </div>
          </div>
        </Link>

        {/* Three small actions stacked */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-1">
          <ActionTile
            href="/recipes/new"
            icon={<PlusIcon size={18} />}
            title="New recipe"
            copy="Type one in from scratch."
          />
          <ActionTile
            href="/recipes"
            icon={<BookIcon size={18} />}
            title="My recipes"
            copy="Browse your full collection."
          />
          <ActionTile
            href="/cookbooks"
            icon={<CollectionIcon size={18} />}
            title="Cookbooks"
            copy="Organize by collection."
          />
        </div>
      </section>

      {/* RECENT RECIPES */}
      <section className="reveal reveal-3 grid gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Recently added</p>
            <h2
              className="mt-1 text-2xl font-medium leading-tight"
              style={{ fontVariationSettings: "'opsz' 56, 'SOFT' 50" }}
            >
              Recent recipes
            </h2>
          </div>
          {recipes && recipes.length > 6 ? (
            <Link href="/recipes" className="text-sm font-semibold text-[var(--accent-deep)] hover:underline">
              View all →
            </Link>
          ) : null}
        </div>

        {recipes === null ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : recentRecipes.length === 0 ? (
          <EmptyState
            tone="paper"
            icon={<SparkleIcon size={22} />}
            title="Your vault starts here"
            description="Scan a handwritten recipe or add one by hand. Everything you save is private to you (and shared family, if you have one)."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button href="/scan" variant="primary" leading={<CameraIcon size={18} />}>
                  Scan first recipe
                </Button>
                <Button href="/recipes/new" variant="secondary" leading={<PlusIcon size={16} />}>
                  Add manually
                </Button>
              </div>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {recentRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group overflow-hidden rounded-[var(--radius-card)] border border-[var(--rule)] bg-[var(--surface)] shadow-[var(--shadow-emboss)] transition-shadow hover:shadow-[var(--shadow-raised)]"
              >
                <RecipeThumb
                  src={recipe.originalImageUrls?.[0]}
                  title={recipe.title}
                />
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
      </section>
    </div>
  );
}

function ActionTile({
  href,
  icon,
  title,
  copy,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--rule)] bg-[var(--surface)] p-4 shadow-[var(--shadow-emboss)] transition-all hover:border-[var(--rule-strong)] hover:bg-[var(--surface-raised)] md:p-5"
    >
      <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-paper)] text-[var(--accent-deep)] transition-transform group-hover:scale-105">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight md:text-base">{title}</span>
        <span className="mt-0.5 block text-xs text-[var(--ink-soft)] md:text-sm">{copy}</span>
      </span>
    </Link>
  );
}

