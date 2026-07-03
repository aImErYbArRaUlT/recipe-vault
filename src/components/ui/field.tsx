"use client";

import * as React from "react";
import { cn } from "./cn";

function useId() {
  return React.useId();
}

type FieldShellProps = {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  optional?: boolean;
  trailing?: React.ReactNode;
};

function Label({
  htmlFor,
  children,
  required,
  optional,
  trailing,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]"
      >
        {children}
        {required ? <span className="ml-1 text-[var(--accent)]">*</span> : null}
        {optional ? <span className="ml-1 font-normal text-[var(--ink-soft)]">(optional)</span> : null}
      </label>
      {trailing}
    </div>
  );
}

const controlBase =
  "w-full rounded-[var(--radius-input)] border bg-[var(--surface-raised)] px-4 py-3.5 text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 transition-colors duration-150 ease-out outline-none disabled:opacity-60";

const controlIdle = "border-[var(--rule)] hover:border-[var(--rule-strong)]";
const controlError = "border-[var(--oxblood)] bg-[var(--oxblood-soft)]/30";

type InputProps = FieldShellProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "id">;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, optional, trailing, className, ...rest },
  ref,
) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} required={required} optional={optional} trailing={trailing}>
        {label}
      </Label>
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        className={cn(controlBase, error ? controlError : controlIdle, className)}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-[var(--oxblood)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-[var(--ink-soft)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

type TextareaProps = FieldShellProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, optional, trailing, className, ...rest },
  ref,
) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} required={required} optional={optional} trailing={trailing}>
        {label}
      </Label>
      <textarea
        ref={ref}
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        className={cn(
          controlBase,
          "min-h-[112px] leading-relaxed",
          error ? controlError : controlIdle,
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-[var(--oxblood)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-[var(--ink-soft)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

type SelectProps = FieldShellProps &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id">;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, required, optional, trailing, className, children, ...rest },
  ref,
) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} required={required} optional={optional} trailing={trailing}>
        {label}
      </Label>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            controlBase,
            "appearance-none pr-10",
            error ? controlError : controlIdle,
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-[var(--oxblood)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-[var(--ink-soft)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
