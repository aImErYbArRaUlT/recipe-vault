/* Editorial-style line icons. Hand-tuned 1.6 stroke, round caps, generous viewBox. */
import * as React from "react";

type Props = React.SVGAttributes<SVGSVGElement> & { size?: number; title?: string };

function base(title?: string) {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": title ? undefined : true,
    role: title ? "img" : undefined,
  };
}

export function VaultIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 24} height={size ?? 24} {...rest}>
      {title ? <title>{title}</title> : null}
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 8.8v-1m0 8.4v-1m3.2-2.4h1m-8.4 0h-1" />
      <path d="M18.5 19.5v1.5M5.5 19.5v1.5" />
    </svg>
  );
}

export function BookIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 24} height={size ?? 24} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M12 6.25v13M12 6.25C10.83 5.33 9.17 4.5 7 4.5c-2 0-3.5.5-4.5 1v13c1-.5 2.5-1 4.5-1 2.17 0 3.83.83 5 1.75M12 6.25c1.17-.92 2.83-1.75 5-1.75 2 0 3.5.5 4.5 1v13c-1-.5-2.5-1-4.5-1-2.17 0-3.83.83-5 1.75" />
    </svg>
  );
}

export function CameraIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 24} height={size ?? 24} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M3.5 9a2 2 0 012-2h1a2 2 0 001.66-.89l.81-1.22A2 2 0 0110.6 4h2.8a2 2 0 011.63.89l.81 1.22A2 2 0 0017.5 7h1a2 2 0 012 2v9a2 2 0 01-2 2h-13a2 2 0 01-2-2V9z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

export function CollectionIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 24} height={size ?? 24} {...rest}>
      {title ? <title>{title}</title> : null}
      <rect x="3.5" y="9" width="17" height="11" rx="2" />
      <path d="M6 9V7a2 2 0 012-2h8a2 2 0 012 2v2M8 5V3.5h8V5" />
    </svg>
  );
}

export function HomeIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 24} height={size ?? 24} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M3.5 11.5L12 4l8.5 7.5" />
      <path d="M5.5 10v9.5h13V10" />
      <path d="M10 19.5v-5h4v5" />
    </svg>
  );
}

export function MenuIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 24} height={size ?? 24} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function ChevronRightIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 16} height={size ?? 16} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronLeftIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 16} height={size ?? 16} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function PlusIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 16} height={size ?? 16} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SearchIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 16} height={size ?? 16} {...rest}>
      {title ? <title>{title}</title> : null}
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  );
}

export function SparkleIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 16} height={size ?? 16} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M12 4v6M12 14v6M4 12h6M14 12h6" />
      <path d="M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />
    </svg>
  );
}

export function MicIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 24} height={size ?? 24} {...rest}>
      {title ? <title>{title}</title> : null}
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0014 0M12 18v3M9 21h6" />
    </svg>
  );
}

export function StopIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 24} height={size ?? 24} {...rest}>
      {title ? <title>{title}</title> : null}
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export function ClockIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 16} height={size ?? 16} {...rest}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2" />
    </svg>
  );
}

export function UsersIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 20} height={size ?? 20} {...rest}>
      {title ? <title>{title}</title> : null}
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3.5 19c0-2.6 2.5-4.5 5.5-4.5s5.5 1.9 5.5 4.5" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M15 14.5c2.5.4 5 1.7 5 4.5" />
    </svg>
  );
}

export function HeartIcon({ size, title, ...rest }: Props) {
  return (
    <svg {...base(title)} width={size ?? 16} height={size ?? 16} {...rest}>
      {title ? <title>{title}</title> : null}
      <path d="M12 19.5l-7-6.3A4.3 4.3 0 0112 7a4.3 4.3 0 017 6.2l-7 6.3z" />
    </svg>
  );
}

export function GoogleMark({ size }: { size?: number }) {
  const s = size ?? 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
