"use client";

import * as React from "react";
import { Button } from "./button";
import { cn } from "./cn";
import { haptic } from "./haptics";

type ConfirmOpts = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "destructive" | "primary";
};

type SheetState = (ConfirmOpts & { resolve: (v: boolean) => void }) | null;

const SheetContext = React.createContext<((opts: ConfirmOpts) => Promise<boolean>) | null>(null);

export function SheetProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SheetState>(null);

  const confirm = React.useCallback((opts: ConfirmOpts) => {
    void haptic("warn");
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  React.useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        state.resolve(false);
        setState(null);
      }
    };
    document.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [state]);

  return (
    <SheetContext.Provider value={confirm}>
      {children}
      {state ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rv-sheet-title"
          className="fixed inset-0 z-[100] flex items-end justify-center md:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              state.resolve(false);
              setState(null);
            }
          }}
        >
          <div
            className="absolute inset-0 bg-[var(--ink)]/55 backdrop-blur-sm"
            style={{ animation: "rv-fade-in 200ms var(--ease-out)" }}
          />
          <div
            className={cn(
              "relative w-full max-w-md rounded-t-[28px] border border-[var(--rule)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lifted)] md:rounded-[var(--radius-card-lg)]",
            )}
            style={{
              animation: "rv-fade-up 320ms var(--ease-out)",
              paddingBottom: "calc(1.5rem + var(--safe-area-bottom))",
            }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--rule-strong)] md:hidden" />
            <h2
              id="rv-sheet-title"
              className="text-2xl font-semibold leading-tight"
              style={{ fontVariationSettings: "'opsz' 56" }}
            >
              {state.title}
            </h2>
            {state.description ? (
              <p className="mt-2 text-sm text-[var(--ink-muted)]">{state.description}</p>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                className="md:w-auto"
                onClick={() => {
                  state.resolve(false);
                  setState(null);
                }}
              >
                {state.cancelLabel ?? "Cancel"}
              </Button>
              <Button
                variant={state.tone === "destructive" ? "destructive" : "primary"}
                size="lg"
                fullWidth
                className="md:w-auto"
                hapticIntensity={state.tone === "destructive" ? "heavy" : "medium"}
                onClick={() => {
                  state.resolve(true);
                  setState(null);
                }}
              >
                {state.confirmLabel ?? "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </SheetContext.Provider>
  );
}

export function useConfirm() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) {
    // graceful fallback to native confirm if provider missing
    return async (opts: ConfirmOpts) => window.confirm(opts.description ?? opts.title);
  }
  return ctx;
}
