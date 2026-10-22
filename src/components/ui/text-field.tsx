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
    <Field label={label} hint={hint} error={error} className="municipal-label block text-sm font-semibold">
      <input
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`municipal-control ${className}`}
      />
    </Field>
  );
}
