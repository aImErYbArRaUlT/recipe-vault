"use client";

import { useEffect, useState } from "react";
import { getAppUrl } from "@/lib/app-url";
import { useFamilyStore } from "@/lib/stores/family";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-shell";
import { haptic } from "@/components/ui/haptics";

export default function FamilyInvitePage() {
  const family = useFamilyStore((s) => s.family);
  const loaded = useFamilyStore((s) => s.loaded);
  const ensureLoaded = useFamilyStore((s) => s.ensureLoaded);
  const setFamily = useFamilyStore((s) => s.set);
  const inviteCode = family?.inviteCode ?? null;
  const loading = !loaded;
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  async function regenerate() {
    setError("");
    const res = await fetch("/api/family/invite", { method: "POST" });
    if (!res.ok) {
      setError("Unable to generate invite code.");
      return;
    }
    const data = await res.json();
    if (family && data.inviteCode) {
      setFamily({ ...family, inviteCode: data.inviteCode });
    }
    void haptic("success");
  }

  async function copyLink() {
    if (!inviteCode) return;
    const link = `${getAppUrl()}/family?code=${inviteCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      void haptic("success");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy. Use the code directly.");
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode || !email.trim()) return;
    setError("");
    setSending(true);
    const res = await fetch("/api/family/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSending(false);
    if (!res.ok) {
      setError("Unable to send invite email.");
      return;
    }
    void haptic("success");
    setEmail("");
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Family"
        title="Invite members"
        subtitle="Share a code or send an email invite. Up to 3 family members on the Family plan."
      />

      {/* Invite code card */}
      <Card tone="raised" padding="lg">
        <p className="eyebrow mb-3">Your invite code</p>
        {loading ? (
          <Skeleton className="h-16 w-full !rounded-[var(--radius-input)]" />
        ) : inviteCode ? (
          <div
            className="flex items-center justify-center rounded-[var(--radius-input)] border border-dashed border-[var(--rule-strong)] bg-[var(--paper)] px-4 py-6"
          >
            <p
              className="select-all text-3xl font-medium tracking-[0.18em] tabular text-[var(--accent-deep)] md:text-4xl"
              style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 56" }}
            >
              {inviteCode}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">Couldn&apos;t load your code.</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={copyLink} disabled={!inviteCode} variant="primary" size="md">
            {copied ? "Copied ✓" : "Copy invite link"}
          </Button>
          <Button onClick={regenerate} variant="secondary" size="md">
            Regenerate code
          </Button>
        </div>
      </Card>

      {/* Email invite */}
      <Card tone="base" padding="lg">
        <p className="eyebrow mb-3">Send by email</p>
        <form onSubmit={sendInvite} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <Input
            type="email"
            label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="family@example.com"
            inputMode="email"
          />
          <Button
            type="submit"
            disabled={!email.trim() || sending}
            loading={sending}
            variant="primary"
            size="lg"
          >
            {sent ? "Sent ✓" : "Send invite"}
          </Button>
        </form>
      </Card>

      {error ? (
        <p className="rounded-[var(--radius-input)] border border-[var(--oxblood)]/30 bg-[var(--oxblood-soft)]/40 px-4 py-3 text-sm font-medium text-[var(--oxblood)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
