import type { ComponentProps } from "react";

export type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "danger";
  busy?: boolean;
  busyLabel?: string;
};

const variants = {
  primary: "bg-blue-800 text-white hover:bg-blue-900",
  secondary: "border border-slate-500 bg-white text-slate-950 hover:bg-slate-100",
  danger: "bg-red-800 text-white hover:bg-red-900",
} as const;

export function Button({
  variant = "primary", busy = false, busyLabel = "Procesando…", disabled,
  className = "", children, type = "button", ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2 font-semibold transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {busy ? busyLabel : children}
    </button>
  );
}
