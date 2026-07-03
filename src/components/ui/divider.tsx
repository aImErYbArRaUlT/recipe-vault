import { cn } from "./cn";

export function Divider({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  if (!label) {
    return <div className={cn("ink-divider", className)} aria-hidden="true" />;
  }
  return (
    <div className={cn("flex items-center gap-4", className)} aria-hidden="true">
      <div className="ink-divider flex-1" />
      <span className="eyebrow-muted text-[10px]">{label}</span>
      <div className="ink-divider flex-1" />
    </div>
  );
}
