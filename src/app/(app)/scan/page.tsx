"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CameraIcon, PlusIcon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-shell";
import { haptic } from "@/components/ui/haptics";

export default function ScanPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(selected: FileList | null) {
    const list = Array.from(selected ?? []);
    setFiles(list);
    setPreviews(list.map((f) => URL.createObjectURL(f)));
  }

  function reset() {
    setFiles([]);
    setPreviews([]);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const onSubmit = async () => {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    void haptic("medium");

    try {
      const imageUrls: string[] = [];

      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("purpose", "scan");
        form.append("subId", crypto.randomUUID());

        const res = await fetch("/api/upload", {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Upload failed");
        }

        const { fileUrl } = await res.json();
        imageUrls.push(fileUrl);
      }

      const scanResponse = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls }),
      });

      if (!scanResponse.ok) {
        const data = await scanResponse.json().catch(() => null);
        throw new Error(data?.error ?? "Scan failed");
      }

      const scanJob = await scanResponse.json();
      void haptic("success");
      router.push(`/scan/review?jobId=${scanJob.id}`);
    } catch (err) {
      void haptic("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-7">
      <PageHeader
        eyebrow="Capture"
        title="Scan a recipe"
        subtitle="Take a photo of a handwritten card or cookbook page. We'll preserve the original and build the digital version."
      />

      <Card tone="base" padding="lg">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          aria-label="Choose recipe images"
        />

        {previews.length === 0 ? (
          <button
            type="button"
            onClick={() => {
              void haptic("light");
              inputRef.current?.click();
            }}
            className="group flex w-full flex-col items-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-[var(--rule-strong)] bg-[var(--paper)] py-14 text-[var(--ink-muted)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-paper)]/30 active:scale-[0.99]"
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-paper)] text-[var(--accent-deep)] transition-transform group-hover:scale-110">
              <CameraIcon size={26} />
            </span>
            <span className="text-sm font-semibold text-[var(--ink)]">
              Tap to take a photo or choose images
            </span>
            <span className="text-xs text-[var(--ink-soft)]">JPG, PNG, or HEIC · up to 8 images per recipe</span>
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {previews.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="scan-frame scan-shadow"
                  style={{ transform: "rotate(0deg)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="aspect-[3/4] w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[var(--ink-muted)] tabular">
                {files.length} {files.length === 1 ? "image" : "images"} ready
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => inputRef.current?.click()}
                  variant="secondary"
                  size="sm"
                  leading={<PlusIcon size={14} />}
                >
                  Add more
                </Button>
                <Button onClick={reset} variant="ghost" size="sm">
                  Start over
                </Button>
              </div>
            </div>
          </>
        )}

        {error ? (
          <p className="mt-4 rounded-[var(--radius-input)] border border-[var(--oxblood)]/30 bg-[var(--oxblood-soft)]/40 px-4 py-3 text-sm font-medium text-[var(--oxblood)]">
            {error}
          </p>
        ) : null}

        <div className="mt-5">
          <Button
            disabled={!files.length || busy}
            loading={busy}
            onClick={onSubmit}
            variant="primary"
            size="lg"
            fullWidth
            hapticIntensity="medium"
          >
            {busy ? "Reading recipe…" : "Scan recipe"}
          </Button>
        </div>
      </Card>

      {/* Tips */}
      <Card tone="paper" padding="md">
        <p className="eyebrow mb-2">Tips for a clean scan</p>
        <ul className="grid gap-1.5 text-sm text-[var(--ink-muted)]">
          <li>Use natural light or a bright lamp, no harsh shadows.</li>
          <li>Lay the page flat, phone parallel to the recipe.</li>
          <li>Multiple pages? Add them all in order before scanning.</li>
        </ul>
      </Card>
    </div>
  );
}
