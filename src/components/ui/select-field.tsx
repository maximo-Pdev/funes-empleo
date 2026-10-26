"use client";
import type { ComponentProps } from "react";
import { Field } from "@/components/forms/field";

export type SelectFieldProps = Omit<ComponentProps<"select">, "id" | "children"> & {
  id: string;
  label: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string | null;
  hint?: string;
  error?: string;
  help?: string;
};

export function SelectField({
  id, label, options, placeholder = "Seleccioná una opción", hint, error, help, required,
  className = "", "aria-describedby": describedBy, ...props
}: SelectFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} help={help} className="municipal-label block text-sm font-semibold">
      <select
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`municipal-control ${className}`}
      >
        {placeholder !== null && <option value="">{placeholder}</option>}
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </Field>
  );
}
