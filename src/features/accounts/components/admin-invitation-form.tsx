"use client";
import { useActionState } from "react";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { Button, TextField } from "@/components/ui";
import { administratorInvitationAction } from "../admin-invitation-actions";
import { initialAccountFormState } from "../form-state";

export function AdminInvitationForm() {
  const [state, action, pending] = useActionState(administratorInvitationAction, initialAccountFormState);
  return <Form action={action} result={state} className="mt-5 grid gap-4" aria-label="Invitar administrador" aria-busy={pending}>
    <TextField id="administrator-invitation-email" label="Correo electrónico" name="email" type="email" autoComplete="off" required maxLength={320} />
    <Field className="flex min-h-11 items-start gap-2"><input type="checkbox" name="confirmed" required />Confirmo que esta persona tendrá permisos completos de administración.</Field>
    <p role="status" aria-live="polite" className={state.success ? "text-sm text-primary" : "text-sm text-red-800"}>{state.message}</p>
    <Button type="submit" disabled={pending || state.success}>{pending ? "Enviando…" : "Enviar invitación"}</Button>
  </Form>;
}
