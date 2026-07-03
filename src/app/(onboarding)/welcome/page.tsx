"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";

const SKILL_OPTIONS = [
  { value: "beginner", label: "Beginner (I follow recipes closely)" },
  { value: "intermediate", label: "Intermediate (I improvise sometimes)" },
  { value: "advanced", label: "Advanced (I cook by feel)" },
];

export default function WelcomePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName || undefined,
        skillLevel: skillLevel || undefined,
        dietaryRestrictions: dietaryRestrictions
          ? dietaryRestrictions.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      }),
    });

    if (!res.ok) {
      setError("Something went wrong. Try again.");
      setSaving(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5"
      style={{
        paddingTop: "var(--safe-area-top)",
        paddingBottom: "var(--safe-area-bottom)",
      }}
    >
      <header className="flex items-center justify-between py-4">
        <Logo variant="full" className="text-base md:text-lg" />
      </header>
      <main id="main" className="flex flex-1 flex-col justify-center gap-7 py-8">
        <div>
          <p className="eyebrow">Welcome aboard</p>
          <h1
            className="mt-2 text-[clamp(2.25rem,5vw,3rem)] font-medium leading-[1.05]"
            style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 50" }}
          >
            Tell us about{" "}
            <span className="italic text-[var(--accent-deep)]" style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 100" }}>
              your kitchen
            </span>
          </h1>
          <p className="mt-3 text-base text-[var(--ink-muted)]">
            We&apos;ll tailor voice guidance and recipe modifications. Skip
            anything. You can change it later in Settings.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-[var(--radius-card-lg)] border border-[var(--rule)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-raised)] md:p-8"
        >
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="What should we call you?"
            optional
          />
          <Select
            label="Skill level"
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
            optional
          >
            <option value="">Choose one…</option>
            {SKILL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input
            label="Dietary preferences"
            value={dietaryRestrictions}
            onChange={(e) => setDietaryRestrictions(e.target.value)}
            placeholder="vegetarian, gluten-free, no nuts"
            hint="Comma separated"
            optional
          />

          {error ? (
            <p className="text-sm font-medium text-[var(--oxblood)]">{error}</p>
          ) : null}

          <Button
            type="submit"
            loading={saving}
            variant="primary"
            size="lg"
            fullWidth
            hapticIntensity="medium"
          >
            {saving ? "Saving…" : "Continue to your vault"}
          </Button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-center text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--accent-deep)]"
          >
            Skip for now
          </button>
        </form>
      </main>
    </div>
  );
}
