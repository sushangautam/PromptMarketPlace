import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  size = "sm",
  className,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };
  const textSizes = { sm: "text-xs", md: "text-sm", lg: "text-base" };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              sizes[size],
              i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-zinc-200 text-zinc-200"
            )}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className={cn("text-zinc-500", textSizes[size])}>
          {rating.toFixed(1)} ({count})
        </span>
      )}
    </div>
  );
}
