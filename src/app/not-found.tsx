import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFoundPage() {
  return (
    <div
      className="flex min-h-screen flex-col px-5"
      style={{
        paddingTop: "var(--safe-area-top)",
        paddingBottom: "var(--safe-area-bottom)",
      }}
    >
      <header className="flex items-center justify-between py-4">
        <Logo variant="full" className="text-base md:text-lg" />
      </header>
      <main className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-lg text-center">
          <p
            className="select-none text-[clamp(7rem,18vw,12rem)] leading-none text-[var(--accent-deep)]"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 1",
              fontWeight: 500,
              fontStyle: "italic",
            }}
          >
            404
          </p>
          <p className="eyebrow mt-3">Page not found</p>
          <h1
            className="mt-3 text-[clamp(1.5rem,3vw,2rem)] font-medium leading-tight"
            style={{ fontVariationSettings: "'opsz' 56, 'SOFT' 50" }}
          >
            We couldn&apos;t find that recipe.
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-base text-[var(--ink-muted)]">
            The page you&apos;re looking for may have been renamed, removed, or
            never existed. Head back to your vault to find your way.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Button href="/dashboard" variant="primary" size="lg">
              Back to dashboard
            </Button>
            <Button href="/recipes" variant="secondary" size="lg">
              Browse recipes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
