import * as React from "react";
import { cn } from "./cn";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h1
          className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-[1.05] tracking-[-0.02em]"
          style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-xl text-sm text-[var(--ink-muted)] md:text-base">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </header>
  );
}

export function Section({
  children,
  className,
  reveal,
}: {
  children: React.ReactNode;
  className?: string;
  reveal?: 1 | 2 | 3 | 4 | 5 | 6;
}) {
  return (
    <section className={cn(reveal ? `reveal reveal-${reveal}` : "", className)}>
      {children}
    </section>
  );
}
