import * as React from "react";
import { cn } from "./cn";

type Tone = "neutral" | "accent" | "moss" | "mustard" | "oxblood" | "ink";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-[var(--paper-sunken)] text-[var(--ink-muted)] border-[var(--rule)]",
  accent: "bg-[var(--accent-paper)] text-[var(--accent-deep)] border-[var(--accent-soft)]",
  moss: "bg-[var(--moss-soft)] text-[var(--moss)] border-[var(--moss)]/30",
  mustard: "bg-[var(--mustard-soft)] text-[var(--mustard)] border-[var(--mustard)]/30",
  oxblood: "bg-[var(--oxblood-soft)] text-[var(--oxblood)] border-[var(--oxblood)]/30",
  ink: "bg-[var(--ink)] text-[var(--ink-inverse)] border-[var(--ink)]",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  dot = false,
  ...rest
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {dot ? (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: "currentColor", opacity: 0.7 }}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}
