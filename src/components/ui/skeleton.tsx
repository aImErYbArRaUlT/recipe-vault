import { cn } from "./cn";

export function Skeleton({
  className,
  rounded = "md",
}: {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "skeleton",
        rounded === "full" && "rounded-full",
        rounded === "lg" && "rounded-[var(--radius-card)]",
        rounded === "md" && "rounded-[var(--radius-input)]",
        rounded === "sm" && "rounded-md",
        className,
      )}
    />
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--rule)] bg-[var(--surface)] shadow-[var(--shadow-emboss)]">
      <Skeleton className="aspect-[4/3] w-full !rounded-none" />
      <div className="grid gap-2 p-3 md:p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
