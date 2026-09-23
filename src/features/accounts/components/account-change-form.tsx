"use client";
import { useActionState } from "react";
import { accountStatusAction } from "../actions";
import { initialAccountFormState } from "../form-state";

export function AccountChangeForm({ id, version, command }: { id: string; version: number; command: "suspend" | "reactivate" | "archive" | "restore" }) {
  const [state, action, pending] = useActionState(accountStatusAction, initialAccountFormState);
  const label = { suspend: "Suspender cuenta", reactivate: "Reactivar cuenta", archive: "Archivar mi cuenta", restore: "Restaurar cuenta" }[command];
  return <form action={action} className="my-4 grid gap-3 rounded border-2 border-red-800 bg-white p-4" aria-busy={pending}>
    <input type="hidden" name="accountId" value={id} /><input type="hidden" name="version" value={version} /><input type="hidden" name="command" value={command} />
    {command !== "archive" && <label>Motivo interno (sin datos personales)<textarea className="block w-full rounded border border-slate-500 p-2" name="reason" required maxLength={500} /></label>}
    <label className="flex items-start gap-2"><input type="checkbox" name="confirmed" required />Confirmo esta acción. El historial se conserva y los accesos revocados no se reactivan automáticamente.</label>
    <p role="status" aria-live="polite">{state.message}</p>
    <button disabled={pending || state.success} className="rounded bg-red-800 p-3 font-semibold text-white disabled:opacity-60">{pending ? "Guardando…" : label}</button>
  </form>;
}
