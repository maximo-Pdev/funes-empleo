import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline";

const variants: Record<BadgeVariant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border bg-card text-foreground",
};

export function Badge({ className, variant = "default", ...props }: ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 w-fit items-center rounded-full px-3 py-1 text-xs font-semibold leading-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
