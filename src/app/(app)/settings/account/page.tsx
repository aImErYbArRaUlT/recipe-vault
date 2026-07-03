"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useUserStore } from "@/lib/stores/user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { useConfirm } from "@/components/ui/sheet";
import { PageHeader } from "@/components/ui/page-shell";

export default function AccountPage() {
  const user = useUserStore((s) => s.user);
  const confirm = useConfirm();
  const email = user?.email ?? "";
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("saving");

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to update password.");
      setStatus("idle");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") {
      setError("Type DELETE to confirm account deletion.");
      return;
    }
    const ok = await confirm({
      title: "Delete your account?",
      description:
        "All your recipes, scans, cookbooks, and cook logs will be permanently deleted. This can't be undone.",
      confirmLabel: "Delete forever",
      cancelLabel: "Keep my account",
      tone: "destructive",
    });
    if (!ok) return;

    const res = await fetch("/api/auth/me", { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete account.");
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Settings" title="Account" />

      {/* Email */}
      <Card tone="base" padding="lg">
        <Input
          label="Email"
          type="email"
          value={email}
          readOnly
          hint="Contact support to change your email."
        />
      </Card>

      {/* Password */}
      <Card tone="base" padding="lg">
        <p className="eyebrow mb-3">Password</p>
        <form className="grid gap-4" onSubmit={handlePasswordChange}>
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="current-password"
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            hint="At least 8 characters."
          />
          <div>
            <Button
              type="submit"
              loading={status === "saving"}
              variant="primary"
              size="lg"
            >
              {status === "saved" ? "Updated ✓" : "Update password"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger zone */}
      <Card tone="base" padding="lg" className="border-[var(--oxblood)]/25">
        <p className="eyebrow text-[var(--oxblood)]">Danger zone</p>
        <h2
          className="mt-1 text-xl font-medium leading-tight"
          style={{ fontFamily: "var(--font-fraunces)", fontVariationSettings: "'opsz' 36" }}
        >
          Delete account
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Type <span className="font-semibold tabular tracking-wider">DELETE</span> to
          confirm. Your recipes, scans, and cook logs are all removed.
        </p>
        <div className="mt-4 grid gap-3">
          <Input
            label="Confirmation"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
          />
          <div>
            <Button
              onClick={handleDeleteAccount}
              variant="destructive"
              size="lg"
              hapticIntensity="heavy"
            >
              Delete my account
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <p className="rounded-[var(--radius-input)] border border-[var(--oxblood)]/30 bg-[var(--oxblood-soft)]/40 px-4 py-3 text-sm font-medium text-[var(--oxblood)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
