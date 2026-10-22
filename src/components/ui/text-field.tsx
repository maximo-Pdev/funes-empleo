import type { ComponentProps } from "react";

export type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({
  id, label, hint, error, required, className = "", "aria-describedby": describedBy, ...props
}: TextFieldProps) {
  const descriptions = [describedBy, hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="municipal-label block text-sm font-semibold text-foreground">
        {label}{required && <span className="ml-1 text-red-800">(obligatorio)</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="text-sm text-foreground-secondary">{hint}</p>}
      <input
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptions}
        className={`municipal-control ${className}`}
      />
      {error && <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-red-800">{error}</p>}
    </div>
  );
}
