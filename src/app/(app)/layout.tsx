"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initCapacitor, initRevenueCat } from "@/lib/capacitor";
import { useUserStore } from "@/lib/stores/user";
import { useRecipesStore } from "@/lib/stores/recipes";
import { useCookbooksStore } from "@/lib/stores/cookbooks";
import { useFamilyStore } from "@/lib/stores/family";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import {
  HomeIcon,
  BookIcon,
  CameraIcon,
  CollectionIcon,
  MenuIcon,
  UsersIcon,
} from "@/components/ui/icon";
import { haptic } from "@/components/ui/haptics";

type IconKey = "home" | "book" | "camera" | "collection" | "menu" | "users";

const Icons: Record<IconKey, React.ComponentType<{ size?: number; className?: string }>> = {
  home: HomeIcon,
  book: BookIcon,
  camera: CameraIcon,
  collection: CollectionIcon,
  menu: MenuIcon,
  users: UsersIcon,
};

const mobileNav: Array<{ href: string; label: string; icon: IconKey }> = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/recipes", label: "Recipes", icon: "book" },
  { href: "/scan", label: "Scan", icon: "camera" },
  { href: "/cookbooks", label: "Books", icon: "collection" },
  { href: "/settings", label: "More", icon: "menu" },
];

const sidebarNav: Array<{ href: string; label: string; icon: IconKey }> = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/recipes", label: "Recipes", icon: "book" },
  { href: "/cookbooks", label: "Cookbooks", icon: "collection" },
  { href: "/scan", label: "Scan", icon: "camera" },
  { href: "/family", label: "Family", icon: "users" },
  { href: "/settings", label: "Settings", icon: "menu" },
];

function planLabel(planId: string | null | undefined) {
  if (!planId) return "Trial";
  return planId.charAt(0).toUpperCase() + planId.slice(1);
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, fetch: fetchUser, refresh: refreshUser } = useUserStore();
  const refreshRecipes = useRecipesStore((s) => s.refresh);
  const refreshCookbooks = useCookbooksStore((s) => s.refresh);
  const refreshFamily = useFamilyStore((s) => s.refresh);
  const pathname = usePathname();
  const planId = user?.planId ?? null;

  useEffect(() => {
    initCapacitor();
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user?.id) initRevenueCat(user.id);
  }, [user?.id]);

  // When the tab regains focus, refresh user + lists silently. The stores
  // already coalesce inflight requests, so this is cheap.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        void refreshUser();
        void refreshRecipes();
        void refreshCookbooks();
        void refreshFamily();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshUser, refreshRecipes, refreshCookbooks, refreshFamily]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div
      className="flex min-h-screen"
      style={{
        paddingTop: "var(--safe-area-top)",
        paddingLeft: "var(--safe-area-left)",
        paddingRight: "var(--safe-area-right)",
      }}
    >
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden w-72 flex-col border-r border-[var(--rule)] bg-[var(--surface)]/80 backdrop-blur-md md:flex">
        <div className="px-7 pb-2 pt-7">
          <Link
            href="/dashboard"
            className="flex items-center"
            aria-label="Recipe Vault, home"
          >
            <Logo variant="full" className="text-lg" />
          </Link>
        </div>
        <nav className="mt-6 grid gap-1 px-4" aria-label="Primary">
          {sidebarNav.map((item) => {
            const Icon = Icons[item.icon];
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-[var(--radius-input)] px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-[var(--accent-paper)] text-[var(--accent-deep)] font-semibold"
                    : "text-[var(--ink-muted)] hover:bg-[var(--paper-sunken)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon
                  size={20}
                  className={active ? "text-[var(--accent-deep)]" : "text-[var(--ink-soft)]"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-5">
          <div className="rounded-[var(--radius-card)] border border-[var(--rule)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-emboss)]">
            <p className="eyebrow-muted">Your plan</p>
            <p
              className="mt-1 text-xl font-medium leading-tight"
              style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 36" }}
            >
              {planLabel(planId)}
            </p>
            <Link
              href="/settings/billing"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-deep)] hover:underline"
            >
              {planId === "pro" || planId === "family" ? "Manage billing" : "Upgrade plan"}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* DESKTOP HEADER */}
        <header className="hidden items-center justify-end gap-3 border-b border-[var(--rule)] bg-[var(--paper)]/70 px-8 py-4 backdrop-blur-sm md:flex">
          {planId === "trial" ? (
            <Badge tone="mustard" dot>
              Trial · upgrade soon
            </Badge>
          ) : (
            <Badge tone="moss" dot>
              {planLabel(planId)}
            </Badge>
          )}
        </header>

        {/* MOBILE HEADER */}
        <header className="flex items-center justify-between gap-3 px-5 pb-1 pt-3 md:hidden">
          <Link href="/dashboard" className="flex items-center" aria-label="Recipe Vault home">
            <Logo variant="full" className="text-base" />
          </Link>
          {planId === "trial" ? (
            <Badge tone="mustard">Trial</Badge>
          ) : null}
        </header>

        <main id="main" className="flex-1 px-5 pb-28 pt-3 md:px-10 md:py-10 md:pb-10">
          {children}
        </main>
      </div>

      {/* MOBILE TAB BAR */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--rule)] bg-[var(--surface)]/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "var(--safe-area-bottom)" }}
      >
        <div className="flex items-stretch justify-around">
          {mobileNav.map((item) => {
            const Icon = Icons[item.icon];
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => void haptic("select")}
                className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 pb-2 pt-2 text-[11px] font-medium transition-colors ${
                  active ? "text-[var(--accent-deep)]" : "text-[var(--ink-soft)]"
                }`}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-1 h-[3px] w-8 -translate-x-1/2 rounded-full bg-[var(--accent)]"
                  />
                ) : null}
                <Icon size={22} className={active ? "text-[var(--accent-deep)]" : "text-[var(--ink-soft)]"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
