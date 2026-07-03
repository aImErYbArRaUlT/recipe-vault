"use client";

import { create } from "zustand";

// Stale-while-revalidate cache for the recipe list, so tab navigation doesn't flash a skeleton.

export type Recipe = {
  id: string;
  title: string;
  description?: string | null;
  cuisine?: string | null;
  tags?: string[] | null;
  cookTimeMinutes?: number | null;
  prepTimeMinutes?: number | null;
  totalTimeMinutes?: number | null;
  originalImageUrls?: string[] | null;
  updatedAt?: string | null;
};

const STALE_MS = 30_000; // background refresh after 30 seconds

type State = {
  recipes: Recipe[] | null;
  lastLoadedAt: number;
  inflight: Promise<void> | null;
  ensureLoaded: () => Promise<void>;
  refresh: () => Promise<void>;
  invalidate: () => void;
  add: (recipe: Recipe) => void;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Recipe>) => void;
  clear: () => void;
};

export const useRecipesStore = create<State>((set, get) => ({
  recipes: null,
  lastLoadedAt: 0,
  inflight: null,

  ensureLoaded: async () => {
    const { recipes, lastLoadedAt, refresh } = get();
    // If we have data and it's fresh, do nothing.
    if (recipes !== null && Date.now() - lastLoadedAt < STALE_MS) return;
    await refresh();
  },

  refresh: async () => {
    // Coalesce concurrent calls so a tab switch plus visibility change don't double-fetch.
    const existing = get().inflight;
    if (existing) return existing;

    const p = (async () => {
      try {
        const res = await fetch("/api/recipes");
        const data = await res.json();
        set({
          recipes: Array.isArray(data) ? data : [],
          lastLoadedAt: Date.now(),
        });
      } catch {
        // Keep whatever we had; only mark loaded so UI exits skeleton.
        if (get().recipes === null) set({ recipes: [] });
      } finally {
        set({ inflight: null });
      }
    })();
    set({ inflight: p });
    return p;
  },

  invalidate: () => set({ lastLoadedAt: 0 }),

  add: (recipe) =>
    set((s) => ({
      recipes: s.recipes ? [recipe, ...s.recipes] : [recipe],
    })),

  remove: (id) =>
    set((s) => ({
      recipes: s.recipes ? s.recipes.filter((r) => r.id !== id) : null,
    })),

  update: (id, patch) =>
    set((s) => ({
      recipes: s.recipes
        ? s.recipes.map((r) => (r.id === id ? { ...r, ...patch } : r))
        : null,
    })),

  clear: () =>
    set({ recipes: null, lastLoadedAt: 0, inflight: null }),
}));
