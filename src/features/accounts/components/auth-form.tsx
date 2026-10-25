"use client";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { useActionState, useEffect, useRef } from "react";
import { Info } from "lucide-react";
import { initialAccountFormState, type AccountFormState } from "../form-state";
import { loginAction, passwordAction, recoveryAction, verificationAction } from "../actions";
import { PasswordField } from "./password-field";

type Mode = "login" | "recovery" | "verification" | "password";
const actions: Record<Mode, (state: AccountFormState, form: FormData) => Promise<AccountFormState>> = {
  login: loginAction, recovery: recoveryAction, verification: verificationAction, password: passwordAction,
};
const titles: Record<Mode, string> = { login: "Iniciar sesión", recovery: "Solicitar enlace de recuperación", verification: "Reenviar verificación", password: "Guardar nueva contraseña" };
export function AuthForm({ mode, submitLabel, homepageLayout = false }: { mode: Mode; submitLabel?: string; homepageLayout?: boolean }) {
  const [state, action, pending] = useActionState(actions[mode], initialAccountFormState);
  const message = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) message.current?.focus(); }, [state]);
  return <Form action={action} result={state} requiredMarkers={homepageLayout && mode === "login" ? "on-missing" : "always"} missingFieldMessages={homepageLayout && mode === "login" ? "summary" : "inline"} preserveOnSuccess={mode === "recovery" || mode === "verification"} className="mt-6 grid gap-4" aria-busy={pending}>
    {mode !== "password" && <div><Field className="block font-semibold" label={<>Correo electrónico</>}><input className="mt-1 w-full rounded border border-slate-500 bg-white p-3" id="email" name="email" type="email" required maxLength={320} autoComplete="email" /></Field></div>}
    {(mode === "login" || mode === "password") && <PasswordField name="password" label={mode === "password" ? "Nueva contraseña" : "Contraseña"} autoComplete={mode === "password" ? "new-password" : "current-password"} help="Entre 6 y 128 caracteres. No compartas tu contraseña." />}
    {mode === "password" && <PasswordField name="confirmation" label="Repetir nueva contraseña" autoComplete="new-password" />}
    <p ref={message} tabIndex={-1} role="status" aria-live="polite" className={mode === "login" && !pending && !state.success && state.message ? "text-red-700" : undefined}>{homepageLayout && (pending || (state.success && state.message)) && <Info size={16} aria-hidden="true" />}{pending ? "Procesando tu solicitud…" : state.message}</p>
    <button type="submit" disabled={pending} className="rounded bg-blue-800 p-3 font-semibold text-white disabled:opacity-60">{submitLabel ?? titles[mode]}</button>
  </Form>;
}
