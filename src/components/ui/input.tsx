import { cn } from "@/lib/utils";
import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm",
          "placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent",
          "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          icon && "pl-10",
          error && "border-red-400 focus:ring-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
