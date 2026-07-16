import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: "brand" | "gold" | "purple" | "blue" | "rose";
  showLabel?: boolean;
  className?: string;
}

export function Progress({ value, max = 100, size = "md", color = "brand", showLabel, className }: ProgressProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  const sizes = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const colors = {
    brand: "bg-brand",
    gold: "bg-gold",
    purple: "bg-purple-500",
    blue: "bg-blue-500",
    rose: "bg-rose-500",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-text-tertiary">Progress</span>
          <span className="text-xs font-medium text-white">{percentage}%</span>
        </div>
      )}
      <div className={cn("w-full bg-white/[0.06] rounded-full overflow-hidden", sizes[size])}>
        <div
          className={cn("rounded-full transition-all duration-500 ease-out", sizes[size], colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
