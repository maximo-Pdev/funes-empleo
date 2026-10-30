"use client";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { useActionState } from "react";
import { accountStatusAction } from "../actions";
import { initialAccountFormState } from "../form-state";
import { Button } from "@/components/ui";
import styles from "./account-decision.module.css";

export function AccountChangeForm({ id, version, command }: { id: string; version: number; command: "suspend" | "reactivate" | "archive" | "restore" }) {
  const [state, action, pending] = useActionState(accountStatusAction, initialAccountFormState);
  const label = { suspend: "Suspender cuenta", reactivate: "Reactivar cuenta", archive: "Archivar cuenta", restore: "Restaurar cuenta" }[command];
  const reactivating = command === "reactivate";
  return <Form action={action} result={state} className={`my-4 grid gap-3 rounded border-2 p-4 ${reactivating ? styles.reactivation : "border-red-800 bg-white"}`} aria-busy={pending}>
    <input type="hidden" name="accountId" value={id} /><input type="hidden" name="version" value={version} /><input type="hidden" name="command" value={command} />
    <Field>Motivo interno (sin datos personales)<textarea className="block w-full rounded border border-slate-500 p-2" name="reason" required maxLength={500} /></Field>
    <Field className="flex items-start gap-2"><input type="checkbox" name="confirmed" required />Confirmo esta acción. El historial se conserva y los accesos revocados no se reactivan automáticamente.</Field>
    <p role="status" aria-live="polite">{state.message}</p>
    <Button type="submit" variant={reactivating ? "primary" : "danger"} busy={pending} busyLabel="Guardando…" disabled={state.success}>{label}</Button>
  </Form>;
}
