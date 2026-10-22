import type { ComponentProps } from "react";

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
  const descriptions = [describedBy, hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="municipal-label block text-sm font-semibold text-foreground">
        {label}{required && <span className="ml-1 text-red-800">(obligatorio)</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="text-sm text-foreground-secondary">{hint}</p>}
      <select
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptions}
        className={`municipal-control ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {error && <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-red-800">{error}</p>}
    </div>
  );
}
