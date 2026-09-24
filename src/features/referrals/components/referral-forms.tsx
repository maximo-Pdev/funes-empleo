"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  submitFeedbackAction,
  submitInterviewAction,
  type ReferralActionState,
} from "@/features/referrals/feedback-actions";

const initialReferralActionState: ReferralActionState = { status: "idle", message: "" };

export function FeedbackForm({ openingId, referralId }: { openingId: string; referralId: string }) {
  const [state, action, pending] = useActionState(submitFeedbackAction, initialReferralActionState);
  return (
    <form action={action} className="rounded-md border border-slate-300 p-4">
      <h3 className="text-lg font-semibold">Informar resultado a la Oficina</h3>
      <p className="mt-1 text-sm text-slate-700">Tu informe queda pendiente. Solo la Oficina confirma el resultado final; informar una respuesta no restaura el acceso a datos revocados.</p>
      <input type="hidden" name="openingId" value={openingId} />
      <input type="hidden" name="referralId" value={referralId} />
      <label htmlFor="resultado-empresa" className="mt-4 block font-medium">Resultado informado</label>
      <select id="resultado-empresa" name="reportedOutcome" required className="mt-1 min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 text-slate-950 focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-700">
        <option value="">Seleccioná un resultado</option>
        <option value="hired">Contratación informada</option>
        <option value="not_selected">No seleccionado</option>
        <option value="candidate_withdrew">La persona se retiró</option>
        <option value="process_cancelled">Proceso cancelado para esta persona</option>
        <option value="other">Otra respuesta</option>
      </select>
      <label htmlFor="detalle-feedback" className="mt-4 block font-medium">Detalle breve (opcional)</label>
      <textarea id="detalle-feedback" name="message" maxLength={2000} rows={3} className="mt-1 w-full rounded-md border border-slate-500 p-3 focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-700" />
      <div className="mt-4"><Button type="submit" busy={pending} busyLabel="Enviando…">Enviar informe</Button></div>
      {state.status !== "idle" && <p role={state.status === "error" ? "alert" : "status"} className="mt-3" aria-live="polite">{state.message}</p>}
    </form>
  );
}

export function InterviewForm({ openingId, referralId, version }: { openingId: string; referralId: string; version: number }) {
  const [state, action, pending] = useActionState(submitInterviewAction, initialReferralActionState);
  return (
    <form action={action} className="rounded-md border border-slate-300 p-4">
      <h3 className="text-lg font-semibold">Registrar entrevista</h3>
      <p className="mt-1 text-sm text-slate-700">Indicá al menos una fecha. Las horas se interpretan en la zona de Funes.</p>
      <input type="hidden" name="openingId" value={openingId} />
      <input type="hidden" name="referralId" value={referralId} />
      <input type="hidden" name="expectedVersion" value={version} />
      <label htmlFor="estado-entrevista" className="mt-4 block font-medium">Estado</label>
      <select id="estado-entrevista" name="status" required className="mt-1 min-h-11 w-full rounded-md border border-slate-500 bg-white px-3 py-2 focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-700">
        <option value="scheduled">Programada</option>
        <option value="completed">Realizada</option>
        <option value="cancelled">Cancelada</option>
        <option value="no_show">No se presentó</option>
      </select>
      <label htmlFor="fecha-programada" className="mt-4 block font-medium">Fecha programada (Funes)</label>
      <input id="fecha-programada" name="scheduledAt" type="datetime-local" className="mt-1 min-h-11 w-full rounded-md border border-slate-500 px-3 py-2 focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-700" />
      <label htmlFor="fecha-realizada" className="mt-4 block font-medium">Fecha realizada (Funes)</label>
      <input id="fecha-realizada" name="heldAt" type="datetime-local" className="mt-1 min-h-11 w-full rounded-md border border-slate-500 px-3 py-2 focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-700" />
      <label htmlFor="detalle-entrevista" className="mt-4 block font-medium">Observación para la Oficina (opcional)</label>
      <textarea id="detalle-entrevista" name="message" maxLength={2000} rows={3} className="mt-1 w-full rounded-md border border-slate-500 p-3 focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-700" />
      <div className="mt-4"><Button type="submit" busy={pending} busyLabel="Guardando…">Registrar entrevista</Button></div>
      {state.status !== "idle" && <p role={state.status === "error" ? "alert" : "status"} className="mt-3" aria-live="polite">{state.message}</p>}
    </form>
  );
}
