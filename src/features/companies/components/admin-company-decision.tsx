"use client";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { useActionState } from "react";
import { adminCompanyAction } from "../admin-actions";

export function AdminCompanyDecision({ accountId, version, command }: { accountId: string; version: number;
  command: "suspend" | "reactivate" | "archive" | "restore" }) {
  const [state, action, pending] = useActionState(adminCompanyAction, { message: "", success: false });
  const label = { suspend: "Suspender empresa", reactivate: "Reactivar empresa", archive: "Archivar empresa", restore: "Restaurar empresa" }[command];
  return <Form action={action} result={state} className="mt-4 grid gap-3 rounded border-2 border-red-800 bg-red-50 p-4" aria-busy={pending}>
    <h3 className="font-semibold text-red-900">{label}</h3>
    <p>La decisión se audita. Los accesos revocados no se reactivan automáticamente.</p>
    <input type="hidden" name="accountId" value={accountId} /><input type="hidden" name="version" value={version} />
    <input type="hidden" name="command" value={command} />
    <Field className="grid gap-1">Motivo interno (no visible a la empresa)<textarea name="reason" required minLength={1} maxLength={500} className="rounded border p-2" /></Field>
    <Field className="flex gap-2"><input type="checkbox" name="confirmed" required />Confirmo esta decisión.</Field>
    <p role={state.success ? "status" : "alert"} aria-live="polite">{state.message}</p>
    <button disabled={pending || state.success} className="rounded bg-red-800 p-3 text-white">{label}</button>
  </Form>;
}
