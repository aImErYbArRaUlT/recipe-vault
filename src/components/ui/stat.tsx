import * as React from "react";

export function StatList({
  items,
  className,
}: {
  items: Array<{ label: string; value: React.ReactNode; key?: string }>;
  className?: string;
}) {
  const filtered = items.filter((i) => i.value !== null && i.value !== undefined && i.value !== "");
  if (filtered.length === 0) return null;
  return (
    <dl className={className}>
      {filtered.map((item, i) => (
        <div
          key={item.key ?? `${item.label}-${i}`}
          className="flex items-baseline justify-between gap-3 border-b border-dashed border-[var(--rule)] py-2.5 last:border-b-0"
        >
          <dt className="eyebrow-muted">{item.label}</dt>
          <dd className="text-sm tabular font-medium text-[var(--ink)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StatGrid({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode; key?: string }>;
}) {
  const filtered = items.filter((i) => i.value !== null && i.value !== undefined && i.value !== "");
  if (filtered.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {filtered.map((item, i) => (
        <div
          key={item.key ?? `${item.label}-${i}`}
          className="rounded-[var(--radius-input)] border border-[var(--rule)] bg-[var(--surface)] px-3 py-2.5"
        >
          <p className="eyebrow-muted text-[10px]">{item.label}</p>
          <p
            className="mt-0.5 tabular text-lg font-semibold leading-tight"
            style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 36" }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
