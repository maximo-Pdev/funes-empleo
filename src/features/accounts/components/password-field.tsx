"use client";
import { useId, useState, type ChangeEvent } from "react";
import { Field } from "@/components/forms/field";
import { InputVisibilityToggle } from "@/components/forms/input-visibility-toggle";

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
      <InputVisibilityToggle inputId={inputId} description={description} visible={visible} onToggle={() => setVisible(previous => !previous)} />
    </div>
  </Field>;
}
