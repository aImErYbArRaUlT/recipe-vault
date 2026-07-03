// Recipe cover image, falling back to a typographic title card when no image exists.
export function RecipeThumb({
  src,
  title,
  className,
  ratio = "aspect-[4/3]",
}: {
  src?: string | null;
  title: string;
  className?: string;
  ratio?: string;
}) {
  if (src) {
    return (
      <div className={`${ratio} w-full overflow-hidden bg-[var(--paper-deep)] ${className ?? ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  // Title-card fallback: first letter on a textured cream background.
  const letter = (title?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <div
      className={`${ratio} w-full overflow-hidden ${className ?? ""}`}
      style={{
        background:
          "radial-gradient(120% 80% at 20% 0%, #fff6ea 0%, transparent 60%), linear-gradient(180deg, var(--accent-paper) 0%, var(--paper-deep) 100%)",
      }}
      aria-hidden="true"
    >
      <div className="flex h-full w-full flex-col items-center justify-center px-4">
        <div className="mb-1 h-px w-10 bg-[var(--accent-deep)]/40" />
        <p className="eyebrow text-[10px] text-[var(--accent-deep)]">Recipe</p>
        <span
          className="mt-1 select-none text-[clamp(3rem,8vw,5rem)] leading-none text-[var(--accent-deep)]"
          style={{
            fontFamily: "var(--font-fraunces)",
            fontVariationSettings: "'opsz' 144, 'SOFT' 30",
            fontWeight: 500,
          }}
        >
          {letter}
        </span>
        <div className="mt-1 h-px w-10 bg-[var(--accent-deep)]/40" />
      </div>
    </div>
  );
}
