"use client";
import type { ComponentProps } from "react";
import { Field } from "@/components/forms/field";

export type SelectFieldProps = Omit<ComponentProps<"select">, "id" | "children"> & {
  id: string;
  label: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
  error?: string;
};

export function SelectField({
  id, label, options, placeholder = "Seleccioná una opción", hint, error, required,
  className = "", "aria-describedby": describedBy, ...props
}: SelectFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} className="block text-sm font-semibold text-slate-950">
      <select
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-slate-950 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${error ? "border-red-700" : ""} ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </Field>
  );
}
