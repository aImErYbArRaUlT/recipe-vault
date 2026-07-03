type LogoProps = {
  variant?: "full" | "icon" | "wordmark";
  className?: string;
  title?: string;
};

// Recipe Vault brand mark: stacked index cards, legible down to favicon size.
function StackedCardsMark({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}

      {/* Back card - rotated counter-clockwise */}
      <rect
        x="3.6"
        y="6.4"
        width="13"
        height="14"
        rx="2"
        transform="rotate(-8 10.1 13.4)"
        opacity="0.45"
      />
      {/* Middle card - slight clockwise */}
      <rect
        x="6"
        y="4.6"
        width="13"
        height="14"
        rx="2"
        transform="rotate(5 12.5 11.6)"
        opacity="0.7"
      />
      {/* Front card - upright, filled for weight */}
      <rect
        x="6.4"
        y="5.2"
        width="13.2"
        height="14.4"
        rx="2.2"
        fill="currentColor"
        opacity="0.08"
      />
      <rect x="6.4" y="5.2" width="13.2" height="14.4" rx="2.2" />
      {/* Front-card accent: a heading rule + two index lines */}
      <path d="M9.4 9.6h7" />
      <path d="M9.4 12.6h7" opacity="0.55" />
      <path d="M9.4 15.2h4.6" opacity="0.55" />
    </svg>
  );
}

export function Logo({ variant = "full", className, title }: LogoProps) {
  const accessibleTitle = title ?? "Recipe Vault";

  if (variant === "icon") {
    return <StackedCardsMark className={className ?? "h-6 w-6"} title={accessibleTitle} />;
  }

  if (variant === "wordmark") {
    return (
      <span
        className={`font-serif font-medium tracking-[-0.015em] ${className ?? "text-lg"}`}
        style={{ fontVariationSettings: "'opsz' 36, 'SOFT' 30" }}
      >
        Recipe Vault
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 leading-none ${className ?? ""}`}
      role="img"
      aria-label={accessibleTitle}
    >
      <StackedCardsMark className="h-[1.35em] w-[1.35em] flex-shrink-0 text-[var(--accent-deep)]" />
      <span
        className="font-serif font-medium tracking-[-0.015em]"
        style={{ fontVariationSettings: "'opsz' 36, 'SOFT' 30" }}
      >
        Recipe Vault
      </span>
    </span>
  );
}
