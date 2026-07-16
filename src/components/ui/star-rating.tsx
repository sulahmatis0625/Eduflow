"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  totalReviews?: number;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  showValue,
  totalReviews,
}: StarRatingProps) {
  const sizes = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-6 w-6" };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(i + 1)}
          className={cn(interactive && "cursor-pointer hover:scale-110 transition-transform")}
        >
          <Star
            className={cn(
              sizes[size],
              i < Math.floor(rating)
                ? "fill-gold text-gold"
                : i < rating
                ? "fill-gold/50 text-gold"
                : "fill-white/[0.08] text-white/[0.08]"
            )}
          />
        </button>
      ))}
      {showValue && (
        <span className="text-sm font-medium text-white ml-1">
          {rating.toFixed(1)}
        </span>
      )}
      {totalReviews !== undefined && (
        <span className="text-sm text-text-tertiary ml-1">({totalReviews})</span>
      )}
    </div>
  );
}
