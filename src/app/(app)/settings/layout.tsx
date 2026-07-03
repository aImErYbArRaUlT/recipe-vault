"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/settings", label: "Profile" },
  { href: "/settings/account", label: "Account" },
  { href: "/settings/billing", label: "Billing" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-4 text-sm">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-4 py-2 transition-colors ${
                active
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border)] text-foreground/70 hover:bg-[var(--accent-soft)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
