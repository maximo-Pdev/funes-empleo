"use client";
// Adapted from official shadcn/ui base-nova button registry.
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex min-h-11 shrink-0 items-center justify-center rounded-sm font-heading font-semibold transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-brand-text",
        default: "bg-primary text-white hover:bg-brand-text",
        secondary: "border border-brand-text bg-white text-brand-text hover:bg-surface-muted",
        outline: "border border-brand-text bg-white text-brand-text hover:bg-surface-muted",
        danger: "bg-red-800 text-white hover:bg-red-900",
        destructive: "bg-red-800 text-white hover:bg-red-900",
        ghost: "text-brand-text hover:bg-surface-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-5 py-2",
        xs: "gap-1 px-2 py-2 text-xs",
        sm: "gap-1 px-3 py-2 text-sm",
        lg: "gap-2 px-6 py-3",
        icon: "min-w-11 p-2",
        "icon-xs": "min-w-11 p-2",
        "icon-sm": "min-w-11 p-2",
        "icon-lg": "min-w-11 p-3",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);
export type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & {
  busy?: boolean;
  busyLabel?: string;
};
export function Button({ variant = "primary", size = "default", busy = false, busyLabel = "Procesando…",
  disabled, className, children, type = "button", nativeButton = true, ...props }: ButtonProps) {
  return <ButtonPrimitive data-slot="button" {...props} type={type} nativeButton={nativeButton}
    disabled={disabled || busy} aria-busy={busy || undefined}
    className={state => cn(buttonVariants({ variant, size }), typeof className === "function" ? className(state) : className)}>
    {busy ? busyLabel : children}
  </ButtonPrimitive>;
}
export { buttonVariants };
