"use client";
import type { ComponentProps } from "react";
import { Field } from "@/components/forms/field";

export type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({
  id, label, hint, error, required, className = "", "aria-describedby": describedBy, ...props
}: TextFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} className="block text-sm font-semibold text-slate-950">
      <input
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-slate-950 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${error ? "border-red-700" : ""} ${className}`}
      />
    </Field>
  );
}
