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
      <label htmlFor={id} className="block text-sm font-semibold text-slate-950">
        {label}{required && <span className="ml-1 text-red-800">(obligatorio)</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="text-sm text-slate-700">{hint}</p>}
      <input
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptions}
        className={`min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-slate-950 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${error ? "border-red-700" : ""} ${className}`}
      />
      {error && <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-red-800">{error}</p>}
    </div>
  );
}
