"use client";

import { create } from "zustand";

export type FamilyMember = {
  id: string;
  name: string | null;
  displayName: string | null;
  email: string | null;
  familyRole: string | null;
};

export type Family = {
  id: string;
  name: string;
  inviteCode: string;
  members?: FamilyMember[];
};

const STALE_MS = 30_000;

type State = {
  family: Family | null;
  loaded: boolean;
  lastLoadedAt: number;
  inflight: Promise<void> | null;
  ensureLoaded: () => Promise<void>;
  refresh: () => Promise<void>;
  invalidate: () => void;
  set: (family: Family | null) => void;
  removeMember: (memberId: string) => void;
  clear: () => void;
};

export const useFamilyStore = create<State>((set, get) => ({
  family: null,
  loaded: false,
  lastLoadedAt: 0,
  inflight: null,

  ensureLoaded: async () => {
    const { loaded, lastLoadedAt, refresh } = get();
    if (loaded && Date.now() - lastLoadedAt < STALE_MS) return;
    await refresh();
  },

  refresh: async () => {
    const existing = get().inflight;
    if (existing) return existing;

    const p = (async () => {
      try {
        const res = await fetch("/api/family");
        if (res.ok) {
          const data = await res.json();
          set({
            family: {
              id: data.id,
              name: data.name,
              inviteCode: data.inviteCode,
              members: data.members ?? [],
            },
            loaded: true,
            lastLoadedAt: Date.now(),
          });
        } else {
          // 404 / 401 / etc. - user is not part of a family.
          set({ family: null, loaded: true, lastLoadedAt: Date.now() });
        }
      } catch {
        // Keep whatever we had; mark loaded so UI exits skeleton state.
        if (!get().loaded) {
          set({ family: null, loaded: true, lastLoadedAt: Date.now() });
        }
      } finally {
        set({ inflight: null });
      }
    })();
    set({ inflight: p });
    return p;
  },

  invalidate: () => set({ lastLoadedAt: 0 }),

  set: (family) => set({ family, loaded: true, lastLoadedAt: Date.now() }),

  removeMember: (memberId) =>
    set((s) =>
      s.family
        ? {
            family: {
              ...s.family,
              members: (s.family.members ?? []).filter((m) => m.id !== memberId),
            },
          }
        : s,
    ),

  clear: () =>
    set({ family: null, loaded: false, lastLoadedAt: 0, inflight: null }),
}));
