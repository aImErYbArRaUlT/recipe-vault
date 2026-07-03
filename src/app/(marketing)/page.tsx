"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function MarketingHomePage() {
  const router = useRouter();
  const [isNative] = useState(() =>
    typeof window !== "undefined" && Capacitor.isNativePlatform(),
  );

  useEffect(() => {
    if (!isNative) return;
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("not authenticated");
      })
      .then(() => router.replace("/dashboard"))
      .catch(() => router.replace("/login"));
  }, [router, isNative]);

  // On native, show a branded splash while the auth check runs so the
  // user never sees the marketing website flash.
  if (isNative) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-[var(--paper)]">
        <Logo variant="full" className="text-2xl" />
        <div className="h-1 w-20 overflow-hidden rounded-full bg-[var(--rule)]">
          <div
            className="h-full w-full rounded-full bg-[var(--accent)]"
            style={{ animation: "rv-shimmer 1.2s ease-in-out infinite", backgroundSize: "200% 100%", background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-soft) 50%, var(--accent) 100%)" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-16 md:gap-24">
      {/* HERO */}
      <section className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] md:gap-14">
        <div className="reveal reveal-1">
          <p className="eyebrow">A digital cookbook · Est. 2026</p>
          <h1
            className="mt-4 text-[clamp(2.75rem,7vw,5.5rem)] font-medium leading-[0.98] tracking-[-0.025em]"
            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
          >
            The recipes you{" "}
            <span className="italic text-[var(--accent-deep)]" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 100" }}>
              keep
            </span>
            ,<br className="hidden sm:inline" /> kept properly.
          </h1>
          <p className="mt-6 max-w-lg text-base text-[var(--ink-muted)] md:text-lg">
            Scan a handwritten card. We preserve the original, every stain and
            margin note, alongside a clean digital recipe and a hands-free AI
            companion that cooks with you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/signup" size="xl" variant="primary">
              Get started free
            </Button>
            <Button href="/pricing" size="xl" variant="secondary">
              See plans
            </Button>
          </div>
          <p className="mt-4 text-xs text-[var(--ink-soft)]">
            Free forever for manual recipes. 3 days of Pro included to try AI.
          </p>
        </div>

        {/* Image plate - composed of two cards, the original scan + the digital recipe */}
        <div className="reveal reveal-2 relative isolate min-h-[420px] md:min-h-[520px]">
          {/* Original scan card - back, rotated */}
          <div className="scan-frame scan-shadow absolute left-[6%] top-2 w-[68%] max-w-[300px] rotate-[-3deg] md:w-[70%]">
            <div
              className="aspect-[3/4] w-full"
              style={{
                background:
                  "repeating-linear-gradient(180deg, transparent 0 22px, rgba(110,68,40,0.18) 22px 23px), linear-gradient(180deg, #fdf3e1, #f4e1c5)",
              }}
            >
              <div className="flex h-full w-full flex-col p-5">
                <p
                  className="text-[1.65rem] leading-[1.05] text-[#5b3a1d]"
                  style={{
                    fontFamily: "var(--font-fraunces)",
                    fontVariationSettings: "'opsz' 96, 'WONK' 1",
                    transform: "rotate(-1.2deg)",
                  }}
                >
                  Nonna&apos;s
                  <br /> Sunday Sauce
                </p>
                <div className="mt-5 grid gap-1 text-[0.78rem] leading-[1.55] text-[#6b3f1f]">
                  <p>2 lbs san marzano tomatoes</p>
                  <p>4 cloves garlic, crushed</p>
                  <p>1 sprig basil, keep stem</p>
                  <p>pinch sugar, if bright</p>
                  <p className="italic">simmer low. don&apos;t rush.</p>
                </div>
                <div className="mt-auto flex items-end justify-between">
                  <span
                    className="text-[#7a4920]"
                    style={{ fontFamily: "var(--font-fraunces)", fontStyle: "italic" }}
                  >
                    for Sunday
                  </span>
                  <span
                    className="rounded-full border border-[#7a4920]/50 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#7a4920]"
                  >
                    1962
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Digital recipe card - front, slight rotation other way */}
          <div className="absolute bottom-2 right-[2%] w-[64%] max-w-[280px] rotate-[2.5deg] rounded-[var(--radius-card-lg)] border border-[var(--rule)] bg-[var(--surface-raised)] p-5 shadow-[var(--shadow-lifted)] md:w-[64%]">
            <p className="eyebrow text-[10px]">Digital recipe</p>
            <p
              className="mt-2 text-2xl leading-tight"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontVariationSettings: "'opsz' 56, 'SOFT' 50",
                fontWeight: 500,
              }}
            >
              Sunday Sauce
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
              <span className="rounded-full border border-[var(--rule)] px-2 py-0.5">Italian</span>
              <span className="rounded-full border border-[var(--rule)] px-2 py-0.5">2 h 20</span>
              <span className="rounded-full border border-[var(--rule)] px-2 py-0.5">Serves 6</span>
            </div>
            <div className="ink-divider my-3" />
            <ul className="grid gap-1.5 text-[12px] text-[var(--ink-muted)]">
              <li className="flex justify-between"><span>San marzano tomatoes</span><span className="tabular">2 lb</span></li>
              <li className="flex justify-between"><span>Garlic, crushed</span><span className="tabular">4 cloves</span></li>
              <li className="flex justify-between"><span>Basil sprig</span><span className="tabular">1</span></li>
            </ul>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-paper)] px-3 py-1.5 text-[11px] font-semibold text-[var(--accent-deep)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
              </svg>
              Cook hands-free with voice
            </div>
          </div>
        </div>
      </section>

      <div className="ink-divider mx-auto w-24" />

      {/* PILLARS */}
      <section className="grid gap-6 md:grid-cols-3 md:gap-8">
        {[
          {
            eyebrow: "I.",
            title: "The original, preserved",
            copy: "The stained index card lives beside the clean digital version. Every margin note kept.",
          },
          {
            eyebrow: "II.",
            title: "A cooking journal",
            copy: "Log what you changed, how it turned out, and what you’d do next time. A living history of your kitchen.",
          },
          {
            eyebrow: "III.",
            title: "A sous chef on call",
            copy: "Hands-free voice guidance, step timers, and on-the-fly modifications for the way you actually cook.",
          },
        ].map((card, i) => (
          <Card
            key={card.title}
            tone="base"
            padding="lg"
            className={`reveal reveal-${i + 3}`}
          >
            <p className="eyebrow-muted">{card.eyebrow}</p>
            <h3
              className="mt-3 text-2xl leading-tight"
              style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 56", fontWeight: 500 }}
            >
              {card.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">{card.copy}</p>
          </Card>
        ))}
      </section>

      {/* CLOSER */}
      <section className="reveal reveal-6 text-center">
        <p className="eyebrow">Ready when you are</p>
        <h2
          className="mx-auto mt-3 max-w-2xl text-[clamp(1.75rem,4vw,3rem)] font-medium leading-[1.05]"
          style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 30" }}
        >
          Bring the cookbook your family has been promising to type up.
        </h2>
        <div className="mt-7 flex justify-center">
          <Button href="/signup" size="xl" variant="primary">
            Get started free
          </Button>
        </div>
        <p className="mt-3 text-xs text-[var(--ink-soft)]">
          Free for manual recipes · 3-day Pro included · cancel any time
        </p>
      </section>
    </div>
  );
}
