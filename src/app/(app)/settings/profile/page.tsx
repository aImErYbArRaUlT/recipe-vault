"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-shell";

type UserProfile = {
  displayName: string | null;
  name: string | null;
  skillLevel: string | null;
  dietaryRestrictions: string[] | null;
  measurementSystem: string | null;
  defaultServings: number | null;
  voiceEnabled: boolean | null;
};

const SKILL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const MEASUREMENT_OPTIONS = [
  { value: "imperial", label: "Imperial (cups, oz)" },
  { value: "metric", label: "Metric (grams, ml)" },
];

export default function SettingsProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dietaryInput, setDietaryInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setProfile({
          displayName: data.displayName ?? null,
          name: data.name ?? null,
          skillLevel: data.skillLevel ?? "intermediate",
          dietaryRestrictions: data.dietaryRestrictions ?? [],
          measurementSystem: data.measurementSystem ?? "imperial",
          defaultServings: data.defaultServings ?? 4,
          voiceEnabled: data.voiceEnabled ?? true,
        });
        setDietaryInput((data.dietaryRestrictions ?? []).join(", "));
        setStatus("idle");
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load profile.");
        setStatus("idle");
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError("");
    setStatus("saving");

    const dietaryRestrictions = dietaryInput
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: profile.displayName,
        skillLevel: profile.skillLevel,
        dietaryRestrictions,
        measurementSystem: profile.measurementSystem,
        defaultServings: profile.defaultServings,
        voiceEnabled: profile.voiceEnabled,
      }),
    });

    if (!res.ok) {
      setError("Failed to save settings.");
      setStatus("idle");
      return;
    }

    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  if (status === "loading" || !profile) {
    return (
      <div className="grid gap-6">
        <PageHeader eyebrow="Settings" title="Profile & preferences" />
        <Card tone="base" padding="lg">
          <div className="grid gap-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-12 w-32 !rounded-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Settings"
        title="Profile & preferences"
        subtitle="How we should address you and tailor recipe guidance."
      />

      <Card tone="base" padding="lg">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <Input
            label="Display name"
            value={profile.displayName ?? ""}
            onChange={(e) =>
              setProfile((prev) => (prev ? { ...prev, displayName: e.target.value } : prev))
            }
            placeholder="What we should call you"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Select
              label="Skill level"
              value={profile.skillLevel ?? "intermediate"}
              onChange={(e) =>
                setProfile((prev) => (prev ? { ...prev, skillLevel: e.target.value } : prev))
              }
            >
              {SKILL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Select
              label="Measurement system"
              value={profile.measurementSystem ?? "imperial"}
              onChange={(e) =>
                setProfile((prev) =>
                  prev ? { ...prev, measurementSystem: e.target.value } : prev,
                )
              }
            >
              {MEASUREMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Dietary preferences"
            value={dietaryInput}
            onChange={(e) => setDietaryInput(e.target.value)}
            placeholder="gluten-free, dairy-free"
            hint="Comma separated"
            optional
          />

          <Input
            label="Default servings"
            type="number"
            inputMode="numeric"
            min={1}
            value={String(profile.defaultServings ?? 4)}
            onChange={(e) =>
              setProfile((prev) =>
                prev ? { ...prev, defaultServings: Number(e.target.value) } : prev,
              )
            }
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-input)] border border-[var(--rule)] bg-[var(--paper)] px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={profile.voiceEnabled ?? true}
              onChange={(e) =>
                setProfile((prev) =>
                  prev ? { ...prev, voiceEnabled: e.target.checked } : prev,
                )
              }
              className="h-5 w-5 rounded border-[var(--rule)] accent-[var(--accent)]"
            />
            <span className="flex-1">
              <span className="block font-semibold">Voice guidance enabled</span>
              <span className="block text-xs text-[var(--ink-soft)]">
                Lets the sous chef speak responses aloud during cooking.
              </span>
            </span>
          </label>

          {error ? (
            <p className="text-sm font-medium text-[var(--oxblood)]">{error}</p>
          ) : null}

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              loading={status === "saving"}
              disabled={status === "saving"}
              variant="primary"
              size="lg"
            >
              {status === "saved" ? "Saved ✓" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
