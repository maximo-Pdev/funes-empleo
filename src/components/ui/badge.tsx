import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/domain/presentation/status-tone";

type BadgeVariant = "default" | "secondary" | "outline" | "status";

const variants: Record<Exclude<BadgeVariant, "status">, string> = {
  default: "min-h-6 bg-primary px-3 text-primary-foreground",
  secondary: "min-h-6 bg-secondary px-3 text-secondary-foreground",
  outline: "min-h-6 border border-border bg-card px-3 text-foreground",
};

/** Solid border and label, tinted surface, and a dot that inherits the label colour. */
const tones: Record<StatusTone, string> = {
  green: "border-status-green bg-status-green-soft text-status-green",
  red: "border-status-red bg-status-red-soft text-status-red",
  amber: "border-status-amber bg-status-amber-soft text-status-amber",
  blue: "border-status-blue bg-status-blue-soft text-status-blue",
  violet: "border-status-violet bg-status-violet-soft text-status-violet",
  neutral: "border-status-neutral bg-status-neutral-soft text-status-neutral",
};

export function Badge({ className, variant = "default", tone = "neutral", children, ...props }: ComponentProps<"span"> & {
  variant?: BadgeVariant; tone?: StatusTone;
}) {
  const isStatus = variant === "status";
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full py-1 text-xs font-semibold leading-none",
        !isStatus && "px-3",
        isStatus && "min-h-[26px] gap-[7px] border pe-[11px] ps-[9px]",
        isStatus ? tones[tone] : variants[variant],
        className,
      )}
      {...props}
    >
      {isStatus && <span aria-hidden="true" className="size-[7px] shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  );
}

