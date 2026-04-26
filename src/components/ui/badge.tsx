import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:   "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
        secondary: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        success:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        warning:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        danger:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        free:      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        outline:   "border border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
