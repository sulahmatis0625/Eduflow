import { cn } from "@/lib/utils";

export function Spinner({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-white/[0.08] border-t-brand", sizes[size], className)} />
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-text-tertiary">Loading...</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden animate-pulse">
      <div className="h-48 bg-white/[0.06]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/[0.06] rounded w-3/4" />
        <div className="h-3 bg-white/[0.06] rounded w-full" />
        <div className="h-3 bg-white/[0.06] rounded w-1/2" />
      </div>
    </div>
  );
}
