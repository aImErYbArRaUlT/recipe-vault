"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/stores/user";
import { useFamilyStore } from "@/lib/stores/family";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/sheet";
import { UsersIcon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-shell";
import { haptic } from "@/components/ui/haptics";

export default function FamilyPage() {
  const family = useFamilyStore((s) => s.family);
  const loaded = useFamilyStore((s) => s.loaded);
  const ensureLoaded = useFamilyStore((s) => s.ensureLoaded);
  const setFamily = useFamilyStore((s) => s.set);
  const removeMemberFromStore = useFamilyStore((s) => s.removeMember);
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const familyRole = useUserStore((s) => s.user?.familyRole ?? null);
  const confirm = useConfirm();

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  async function createFamily() {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("Unable to create family.");
      return;
    }
    void haptic("success");
    const data = await response.json();
    setFamily({
      id: data.id,
      name: data.name,
      inviteCode: data.inviteCode,
      members: [],
    });
  }

  async function joinFamily() {
    if (!inviteCode.trim()) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/family/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("Unable to join family. Check the code and try again.");
      return;
    }
    void haptic("success");
    const data = await response.json();
    setFamily({
      id: data.id,
      name: data.name,
      inviteCode: data.inviteCode,
      members: [],
    });
  }

  async function leaveFamily() {
    const ok = await confirm({
      title: "Leave this family?",
      description: "You'll lose access to the shared cookbook. Your own recipes stay with you.",
      confirmLabel: "Leave family",
      cancelLabel: "Stay",
      tone: "destructive",
    });
    if (!ok) return;
    setError("");
    const response = await fetch("/api/family/leave", { method: "POST" });
    if (!response.ok) {
      setError("Unable to leave family.");
      return;
    }
    setFamily(null);
  }

  async function removeMember(memberId: string, memberName: string) {
    const ok = await confirm({
      title: `Remove ${memberName}?`,
      description: "They will lose access to the family cookbook.",
      confirmLabel: "Remove member",
      tone: "destructive",
    });
    if (!ok) return;
    const response = await fetch(`/api/family/members/${memberId}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Unable to remove member.");
      return;
    }
    removeMemberFromStore(memberId);
  }

  async function copyInvite() {
    if (!family) return;
    try {
      await navigator.clipboard.writeText(family.inviteCode);
      setCopied(true);
      void haptic("success");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  if (!loaded) {
    return (
      <div className="grid gap-6">
        <PageHeader eyebrow="Together" title="Family kitchen" />
        <Skeleton className="h-48 w-full !rounded-[var(--radius-card-lg)]" />
      </div>
    );
  }

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Together"
        title="Family kitchen"
        subtitle="Share a cookbook with up to four people. One admin manages billing and invites."
      />

      {family ? (
        <>
          <Card tone="raised" padding="lg">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Your family</p>
                <h2
                  className="mt-2 text-3xl font-medium leading-tight"
                  style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 56" }}
                >
                  {family.name}
                </h2>
                <div className="mt-3 flex items-center gap-2">
                  <Badge tone="neutral">Code · {family.inviteCode}</Badge>
                  <Button onClick={copyInvite} variant="ghost" size="sm">
                    {copied ? "Copied ✓" : "Copy"}
                  </Button>
                </div>
              </div>
              {familyRole === "admin" ? (
                <Button href="/family/invite" variant="primary" size="md">
                  Invite member
                </Button>
              ) : null}
            </div>
          </Card>

          {/* Members */}
          <div>
            <p className="eyebrow mb-3">Members</p>
            {(family.members ?? []).length === 0 ? (
              <EmptyState
                tone="paper"
                icon={<UsersIcon size={20} />}
                title="No members yet"
                description="Share your invite code to bring family in."
              />
            ) : (
              <div className="grid gap-3">
                {(family.members ?? []).map((member) => {
                  const displayName =
                    member.displayName ?? member.name ?? member.email ?? "Member";
                  return (
                    <Card key={member.id} tone="base" padding="sm" className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-paper)] text-[var(--accent-deep)] font-semibold">
                          {displayName.trim().charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{displayName}</p>
                          {member.email ? (
                            <p className="truncate text-xs text-[var(--ink-soft)]">{member.email}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.familyRole === "admin" ? (
                          <Badge tone="accent">Admin</Badge>
                        ) : (
                          <Badge tone="neutral">Member</Badge>
                        )}
                        {familyRole === "admin" && member.familyRole !== "admin" ? (
                          <Button
                            onClick={() => removeMember(member.id, displayName)}
                            variant="ghost"
                            size="sm"
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/family/cookbook"
              className="rounded-full border border-[var(--rule)] bg-[var(--surface-raised)] px-5 py-2.5 text-sm font-semibold hover:border-[var(--rule-strong)]"
            >
              View shared cookbook
            </Link>
            <Button onClick={leaveFamily} variant="destructive" size="md">
              Leave family
            </Button>
          </div>
        </>
      ) : (
        <>
          <Card tone="base" padding="lg">
            <p className="eyebrow mb-3">Start a family</p>
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <Input
                label="Family name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="The Johnson Kitchen"
              />
              <Button
                onClick={createFamily}
                disabled={busy || !name.trim()}
                loading={busy}
                variant="primary"
                size="lg"
              >
                Create family
              </Button>
            </div>
          </Card>

          <Card tone="paper" padding="lg">
            <p className="eyebrow mb-3">Or join one</p>
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <Input
                label="Invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="INVITE123"
                hint="Ask your family admin for the code."
              />
              <Button
                onClick={joinFamily}
                disabled={busy || !inviteCode.trim()}
                loading={busy}
                variant="secondary"
                size="lg"
              >
                Join
              </Button>
            </div>
          </Card>
        </>
      )}

      {error ? (
        <p className="rounded-[var(--radius-input)] border border-[var(--oxblood)]/30 bg-[var(--oxblood-soft)]/40 px-4 py-3 text-sm font-medium text-[var(--oxblood)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
