"use client";

import { create } from "zustand";

type User = {
  id: string;
  email: string;
  displayName?: string | null;
  planId?: string | null;
  subscriptionStatus?: string | null;
  subscriptionPlatform?: string | null;
  trialEndsAt?: string | null;
  familyId?: string | null;
  familyRole?: string | null;
};

type UserStore = {
  user: User | null;
  loaded: boolean;
  lastLoadedAt: number;
  inflight: Promise<void> | null;
  fetch: () => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
};

// Session data is refreshed in the background after this age.
const STALE_MS = 60_000;

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loaded: false,
  lastLoadedAt: 0,
  inflight: null,

  fetch: async () => {
    const { loaded, lastLoadedAt, refresh } = get();
    if (loaded && Date.now() - lastLoadedAt < STALE_MS) return;
    await refresh();
  },

  refresh: async () => {
    const existing = get().inflight;
    if (existing) return existing;

    const p = (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) throw new Error("not authenticated");
        const data = await res.json();
        set({ user: data, loaded: true, lastLoadedAt: Date.now() });
      } catch {
        set({ user: null, loaded: true, lastLoadedAt: Date.now() });
      } finally {
        set({ inflight: null });
      }
    })();
    set({ inflight: p });
    return p;
  },

  clear: () =>
    set({ user: null, loaded: false, lastLoadedAt: 0, inflight: null }),
}));
