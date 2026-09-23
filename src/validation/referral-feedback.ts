import { z } from "zod";

// Accept deterministic PostgreSQL GUID fixtures as well as normal UUID v4 IDs.
const id = z.guid();
const shortMessage = z.string().trim().max(2_000);

export const companyFeedbackInput = z.object({
  referralId: id,
  reportedOutcome: z.enum(["hired", "not_selected", "candidate_withdrew", "process_cancelled", "other"]),
  message: shortMessage.optional(),
});

export const companyInterviewInput = z.object({
  referralId: id,
  expectedVersion: z.coerce.number<number>().int().positive(),
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]),
  scheduledAt: z.iso.datetime({ offset: true }).optional(),
  heldAt: z.iso.datetime({ offset: true }).optional(),
  message: shortMessage.optional(),
}).refine((value) => Boolean(value.scheduledAt || value.heldAt), {
  message: "Indicá al menos una fecha de entrevista.",
  path: ["scheduledAt"],
});

export const adminOutcomeInput = z.object({
  participationId: id,
  expectedVersion: z.coerce.number<number>().int().positive(),
  outcome: z.enum(["hired", "not_selected", "cancelled"]),
  lateCorrection: z.boolean().default(false),
  reason: z.string().trim().min(1).max(1_000).optional(),
  feedbackId: id.optional(),
  contactId: id.optional(),
}).superRefine((value, ctx) => {
  if ((value.lateCorrection || value.outcome === "cancelled") && !value.reason) {
    ctx.addIssue({ code: "custom", message: "Indicá un motivo para esta decisión.", path: ["reason"] });
  }
  if (value.lateCorrection && !value.feedbackId && !value.contactId) {
    ctx.addIssue({ code: "custom", message: "La corrección tardía requiere feedback o un contacto municipal registrado.", path: ["feedbackId"] });
  }
});
