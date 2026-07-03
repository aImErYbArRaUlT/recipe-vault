"use client";

import { create } from "zustand";

export type Cookbook = {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isShared?: boolean | null;
};

const STALE_MS = 30_000;

type State = {
  cookbooks: Cookbook[] | null;
  lastLoadedAt: number;
  inflight: Promise<void> | null;
  ensureLoaded: () => Promise<void>;
  refresh: () => Promise<void>;
  invalidate: () => void;
  add: (cookbook: Cookbook) => void;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Cookbook>) => void;
  clear: () => void;
};

export const useCookbooksStore = create<State>((set, get) => ({
  cookbooks: null,
  lastLoadedAt: 0,
  inflight: null,

  ensureLoaded: async () => {
    const { cookbooks, lastLoadedAt, refresh } = get();
    if (cookbooks !== null && Date.now() - lastLoadedAt < STALE_MS) return;
    await refresh();
  },

  refresh: async () => {
    const existing = get().inflight;
    if (existing) return existing;

    const p = (async () => {
      try {
        const res = await fetch("/api/cookbooks");
        const data = await res.json();
        set({
          cookbooks: Array.isArray(data) ? data : [],
          lastLoadedAt: Date.now(),
        });
      } catch {
        if (get().cookbooks === null) set({ cookbooks: [] });
      } finally {
        set({ inflight: null });
      }
    })();
    set({ inflight: p });
    return p;
  },

  invalidate: () => set({ lastLoadedAt: 0 }),
  add: (cookbook) =>
    set((s) => ({
      cookbooks: s.cookbooks ? [cookbook, ...s.cookbooks] : [cookbook],
    })),
  remove: (id) =>
    set((s) => ({
      cookbooks: s.cookbooks ? s.cookbooks.filter((c) => c.id !== id) : null,
    })),
  update: (id, patch) =>
    set((s) => ({
      cookbooks: s.cookbooks
        ? s.cookbooks.map((c) => (c.id === id ? { ...c, ...patch } : c))
        : null,
    })),
  clear: () =>
    set({ cookbooks: null, lastLoadedAt: 0, inflight: null }),
}));
