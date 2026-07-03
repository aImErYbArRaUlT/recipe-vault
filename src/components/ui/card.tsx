import * as React from "react";
import { cn } from "./cn";

type Tone = "base" | "raised" | "sunken" | "paper" | "accent";

const toneClasses: Record<Tone, string> = {
  base:
    "bg-[var(--surface)] border border-[var(--rule)] shadow-[var(--shadow-emboss)]",
  raised:
    "bg-[var(--surface-raised)] border border-[var(--rule)] shadow-[var(--shadow-raised)]",
  sunken:
    "bg-[var(--paper-sunken)] border border-[var(--rule)] shadow-[var(--shadow-sunken)]",
  paper:
    "bg-[var(--paper)] border border-[var(--rule-faint)]",
  accent:
    "bg-[var(--accent-paper)] border border-[var(--accent-soft)] shadow-[var(--shadow-emboss)]",
};

type Padding = "none" | "sm" | "md" | "lg" | "xl";

const paddingClasses: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5 md:p-6",
  lg: "p-6 md:p-8",
  xl: "p-7 md:p-10",
};

export function Card({
  tone = "base",
  padding = "md",
  className,
  children,
  asChild = false,
  ...rest
}: {
  tone?: Tone;
  padding?: Padding;
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const classes = cn(
    "rounded-[var(--radius-card)] md:rounded-[var(--radius-card-lg)]",
    toneClasses[tone],
    paddingClasses[padding],
    className,
  );
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        {title ? (
          <h2 className="text-xl font-semibold leading-tight md:text-2xl">{title}</h2>
        ) : null}
        {subtitle ? (
          <p className="mt-1.5 text-sm text-[var(--ink-muted)]">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}
