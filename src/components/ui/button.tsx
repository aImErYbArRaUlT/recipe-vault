"use client";

import Link from "next/link";
import * as React from "react";
import { cn } from "./cn";
import { haptic } from "./haptics";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "destructive" | "subtle";
type Size = "sm" | "md" | "lg" | "xl";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-white border border-[var(--accent-deep)]/40 shadow-[var(--shadow-raised)] hover:bg-[var(--accent-deep)] active:translate-y-px",
  secondary:
    "bg-[var(--surface-raised)] text-[var(--ink)] border border-[var(--rule)] shadow-[var(--shadow-emboss)] hover:bg-[var(--paper-sunken)] active:translate-y-px",
  ghost:
    "bg-transparent text-[var(--ink)] hover:bg-[var(--accent-soft)]/60 active:translate-y-px",
  outline:
    "bg-transparent text-[var(--accent-deep)] border-2 border-[var(--accent)] hover:bg-[var(--accent-paper)] active:translate-y-px",
  destructive:
    "bg-transparent text-[var(--oxblood)] border border-[var(--oxblood)]/30 hover:bg-[var(--oxblood-soft)] active:translate-y-px",
  subtle:
    "bg-[var(--paper-sunken)] text-[var(--ink)] border border-[var(--rule)] hover:bg-[var(--paper-deep)] active:translate-y-px",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-xs gap-1.5 rounded-full",
  md: "h-11 px-5 text-sm gap-2 rounded-full",
  lg: "h-12 px-6 text-sm gap-2 rounded-full",
  xl: "h-14 px-7 text-base gap-2.5 rounded-full",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
  hapticIntensity?: "light" | "medium" | "heavy" | "select" | "success" | false;
};

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
    prefetch?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 1-9 9"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const base =
  "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold tracking-[-0.005em] transition-[transform,background-color,box-shadow,border-color] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0";

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = "primary",
      size = "md",
      loading = false,
      leading,
      trailing,
      fullWidth = false,
      className,
      children,
      hapticIntensity = "light",
      ...rest
    } = props as CommonProps & { href?: string };

    const classes = cn(
      base,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && "w-full",
      className,
    );

    const content = (
      <>
        {loading ? <Spinner /> : leading}
        <span className="inline-flex items-center">{children}</span>
        {!loading && trailing}
      </>
    );

    if ("href" in props && props.href) {
      const { href, ...linkRest } = rest as React.AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string;
      };
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          onClick={(e) => {
            if (hapticIntensity) void haptic(hapticIntensity);
            linkRest.onClick?.(e);
          }}
          {...linkRest}
        >
          {content}
        </Link>
      );
    }

    const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        disabled={loading || buttonRest.disabled}
        type={buttonRest.type ?? "button"}
        onClick={(e) => {
          if (hapticIntensity && !buttonRest.disabled) void haptic(hapticIntensity);
          buttonRest.onClick?.(e);
        }}
        {...buttonRest}
      >
        {content}
      </button>
    );
  },
);
