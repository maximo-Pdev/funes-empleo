"use client";
import { useActionState, useEffect, useRef } from "react";
import { initialAccountFormState, type AccountFormState } from "../form-state";
import { loginAction, passwordAction, recoveryAction, verificationAction } from "../actions";

type Mode = "login" | "recovery" | "verification" | "password";
const actions: Record<Mode, (state: AccountFormState, form: FormData) => Promise<AccountFormState>> = {
  login: loginAction, recovery: recoveryAction, verification: verificationAction, password: passwordAction,
};
const titles: Record<Mode, string> = { login: "Iniciar sesión", recovery: "Solicitar enlace de recuperación", verification: "Reenviar verificación", password: "Guardar nueva contraseña" };
export function AuthForm({ mode }: { mode: Mode }) {
  const [state, action, pending] = useActionState(actions[mode], initialAccountFormState);
  const message = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) message.current?.focus(); }, [state]);
  return <form action={action} className="mt-6 grid gap-4" aria-busy={pending}>
    {mode !== "password" && <div><label className="block font-semibold" htmlFor="email">Correo electrónico</label><input className="mt-1 w-full rounded border border-slate-500 bg-white p-3" id="email" name="email" type="email" required maxLength={320} autoComplete="email" /></div>}
    {(mode === "login" || mode === "password") && <div><label className="block font-semibold" htmlFor="password">{mode === "password" ? "Nueva contraseña" : "Contraseña"}</label><input className="mt-1 w-full rounded border border-slate-500 bg-white p-3" id="password" name="password" type="password" required minLength={6} maxLength={128} autoComplete={mode === "password" ? "new-password" : "current-password"} aria-describedby="password-help" /><p id="password-help" className="mt-1 text-sm">Al menos 6 caracteres. No compartas tu contraseña.</p></div>}
    {mode === "password" && <div><label className="block font-semibold" htmlFor="confirmation">Repetir nueva contraseña</label><input className="mt-1 w-full rounded border border-slate-500 bg-white p-3" id="confirmation" name="confirmation" type="password" required autoComplete="new-password" /></div>}
    <p ref={message} tabIndex={-1} role="status" aria-live="polite">{pending ? "Procesando tu solicitud…" : state.message}</p>
    <button disabled={pending} className="rounded bg-blue-800 p-3 font-semibold text-white disabled:opacity-60">{titles[mode]}</button>
  </form>;
}
