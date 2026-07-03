import * as React from "react";
import { cn } from "./cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  tone = "base",
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  tone?: "base" | "paper";
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border md:rounded-[var(--radius-card-lg)]",
        tone === "paper"
          ? "border-dashed border-[var(--rule-strong)] bg-[var(--paper)]"
          : "border-[var(--rule)] bg-[var(--surface)] shadow-[var(--shadow-emboss)]",
        "px-6 py-10 text-center md:py-14",
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-paper)] text-[var(--accent-deep)]"
        >
          {icon}
        </div>
      ) : null}
      <h3
        className="text-2xl font-semibold leading-tight"
        style={{ fontVariationSettings: "'opsz' 56" }}
      >
        {title}
      </h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--ink-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
