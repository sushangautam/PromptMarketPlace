import Image from "next/image";
import { cn } from "@/lib/utils";

const sizes = { xs: "h-6 w-6 text-xs", sm: "h-8 w-8 text-sm", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" };

export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className={cn("relative rounded-full overflow-hidden bg-violet-100 flex items-center justify-center shrink-0 font-medium text-violet-700", sizes[size], className)}>
      {src ? (
        <Image src={src} alt={name} fill className="object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
