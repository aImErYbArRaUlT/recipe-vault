"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useUserStore } from "@/lib/stores/user";
import { useRecipesStore } from "@/lib/stores/recipes";
import { useCookbooksStore } from "@/lib/stores/cookbooks";
import { useFamilyStore } from "@/lib/stores/family";
import { PageHeader } from "@/components/ui/page-shell";
import { useConfirm } from "@/components/ui/sheet";
import { ChevronRightIcon } from "@/components/ui/icon";

const sections = [
  {
    href: "/settings/profile",
    label: "Profile & preferences",
    description: "Display name, skill level, dietary restrictions",
  },
  {
    href: "/settings/account",
    label: "Account",
    description: "Email, password, delete account",
  },
  {
    href: "/settings/billing",
    label: "Billing",
    description: "Plan, subscription, invoices",
  },
  {
    href: "/family",
    label: "Family",
    description: "Shared cookbook, members, invites",
  },
];

export default function SettingsPage() {
  const confirm = useConfirm();
  const clearUser = useUserStore((s) => s.clear);
  const clearRecipes = useRecipesStore((s) => s.clear);
  const clearCookbooks = useCookbooksStore((s) => s.clear);
  const clearFamily = useFamilyStore((s) => s.clear);

  async function handleLogout() {
    const ok = await confirm({
      title: "Log out of Recipe Vault?",
      description: "You'll need to sign in again to access your recipes.",
      confirmLabel: "Log out",
      cancelLabel: "Stay signed in",
    });
    if (!ok) return;

    // Await the session cookie clear so we don't race the layout's user
    // re-fetch effect.
    try {
      await signOut({ redirect: false });
    } catch (err) {
      console.error("[logout] signOut threw", err);
    }

    // Drop cached client state.
    clearUser();
    clearRecipes();
    clearCookbooks();
    clearFamily();

    // Force a full navigation even if signOut silently failed.
    window.location.href = "/login";
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Account" title="Settings" />

      <div className="overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--rule)] bg-[var(--surface)] shadow-[var(--shadow-emboss)]">
        {sections.map((section, index) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex items-center justify-between gap-4 border-b border-[var(--rule)] px-5 py-4 transition-colors last:border-b-0 hover:bg-[var(--paper-sunken)]"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="min-w-0">
              <p className="text-base font-semibold leading-tight">{section.label}</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{section.description}</p>
            </div>
            <ChevronRightIcon size={18} className="flex-shrink-0 text-[var(--ink-soft)]" />
          </Link>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full rounded-[var(--radius-card)] border border-[var(--oxblood)]/25 bg-[var(--oxblood-soft)] px-5 py-4 text-sm font-semibold text-[var(--oxblood)] transition-colors hover:bg-[var(--oxblood)] hover:text-white"
      >
        Log out
      </button>
    </div>
  );
}
