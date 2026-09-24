import { z } from "zod";
import { PREINTERVIEW_CHANNELS } from "@/domain/catalogs";

export const adminParticipationActionInput = z.object({
  participationId: z.guid(), version: z.number().int().positive(),
  command: z.enum(["start_review", "record_preinterview", "preselect", "skip_to_preinterview",
    "skip_to_preselected", "refer", "mark_awaiting_feedback", "confirm_hired",
    "confirm_not_selected", "correct_hired", "correct_not_selected", "correct_cancelled",
    "withdraw_on_request", "cancel_individual"]),
  reason: z.string().trim().max(1000).default(""),
  channel: z.preprocess((value) => value === "" ? undefined : value,
    z.enum(PREINTERVIEW_CHANNELS).optional()),
  summary: z.string().trim().max(5000).default(""),
  scheduledAtLocal: z.string().optional(), heldAtLocal: z.string().optional(),
  recommendation: z.enum(["pending", "preselect", "do_not_preselect"]).default("pending"),
  feedbackId: z.guid().optional(), contactId: z.guid().optional(),
  candidateRequestId: z.guid().optional(),
}).superRefine((value, context) => {
  const fail = (path: string, message: string) => context.addIssue({ code: "custom", path: [path], message });
  if (value.command === "record_preinterview") {
    if (!value.channel) fail("channel", "Indicá el canal de la preentrevista.");
    if (!value.summary) fail("summary", "Registrá un resumen interno.");
    if (!value.scheduledAtLocal && !value.heldAtLocal) fail("heldAtLocal", "Indicá la fecha de la preentrevista.");
  }
  if (["skip_to_preinterview", "skip_to_preselected", "cancel_individual", "correct_hired",
    "correct_not_selected", "correct_cancelled"].includes(value.command) && !value.reason) {
    fail("reason", "Ingresá un motivo interno.");
  }
  if (value.command === "withdraw_on_request" && !value.candidateRequestId) {
    fail("candidateRequestId", "Seleccioná el contacto que registra la solicitud del candidato.");
  }
  if (value.command.startsWith("correct_") && !value.feedbackId && !value.contactId) {
    fail("feedbackId", "La corrección requiere feedback o un contacto municipal registrado.");
  }
  if (["confirm_hired", "confirm_not_selected"].includes(value.command) &&
    !value.reason && !value.feedbackId && !value.contactId) {
    fail("reason", "Registrá el motivo o seleccioná la evidencia del resultado.");
  }
});

export type AdminParticipationActionInput = z.output<typeof adminParticipationActionInput>;
