"use client";
import { useId, useState, type ChangeEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "@/components/forms/field";

type PasswordFieldProps = {
  name: "password" | "confirmation";
  label: string;
  autoComplete: "current-password" | "new-password";
  help?: string;
  defaultValue?: string;
};

function updateConfirmationValidity(event: ChangeEvent<HTMLInputElement>) {
  const form = event.currentTarget.form;
  const password = form?.elements.namedItem("password");
  const confirmation = form?.elements.namedItem("confirmation");
  if (password instanceof HTMLInputElement && confirmation instanceof HTMLInputElement) {
    confirmation.setCustomValidity(confirmation.value && password.value !== confirmation.value
      ? "Las contraseñas deben coincidir." : "");
  }
}

export function PasswordField({ name, label, autoComplete, help, defaultValue }: PasswordFieldProps) {
  const inputId = useId();
  const [visible, setVisible] = useState(false);
  const description = name === "confirmation" ? "confirmación de contraseña" : "contraseña";
  return <Field label={label} hint={help} className="block font-semibold">
    <div className="mt-1 flex items-stretch gap-2">
      <input id={inputId} name={name} type={visible ? "text" : "password"} defaultValue={defaultValue}
        required minLength={6} maxLength={128} autoComplete={autoComplete}
        onChange={updateConfirmationValidity}
        className="min-w-0 w-full rounded border border-slate-500 bg-white p-3" />
      <button type="button" aria-controls={inputId} aria-pressed={visible}
        aria-label={`${visible ? "Ocultar" : "Mostrar"} ${description}`}
        onClick={() => setVisible(previous => !previous)}
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded border border-brand-text bg-brand-text p-3 text-white hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
      </button>
    </div>
  </Field>;
}
