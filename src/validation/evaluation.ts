import { z } from "zod";
import { CONTACT_CHANNELS, PREINTERVIEW_CHANNELS } from "@/domain/catalogs";

const id = z.guid();
const version = z.coerce.number<number>().int().positive();
const body = z.string().trim().min(1).max(5000);
const reason = z.string().trim().min(1).max(1000);
const instant = z.iso.datetime({ offset: true });

export const evaluationInput = z.discriminatedUnion("command", [
  z.object({ command: z.literal("start_review"), participationId: id, version }),
  z.object({ command: z.literal("record_preinterview"), participationId: id, version,
    channel: z.enum(PREINTERVIEW_CHANNELS), summary: body,
    reason: reason.optional(), scheduledAt: instant.optional(), heldAt: instant.optional(),
    recommendation: z.enum(["pending", "preselect", "do_not_preselect"]).default("pending"),
  }).refine((value) => Boolean(value.scheduledAt || value.heldAt), {
    path: ["heldAt"], message: "Indicá cuándo se programó o realizó la preentrevista.",
  }),
  z.object({ command: z.literal("preselect"), participationId: id, version,
    reason: reason.optional() }),
  z.object({ command: z.enum(["skip_to_preinterview", "skip_to_preselected"]),
    participationId: id, version, reason }),
  z.object({ command: z.literal("mark_awaiting_feedback"), participationId: id, version }),
  z.object({ command: z.literal("record_contact"), participationId: id, version,
    channel: z.enum(CONTACT_CHANNELS), occurredAt: instant, summary: body,
    direction: z.enum(["inbound", "outbound"]).default("outbound"),
    nextActionAt: instant.optional() }),
  z.object({ command: z.literal("record_training_guidance"), candidateId: id,
    version, body, supersedesNoteId: id.optional() }),
  z.object({ command: z.literal("record_applicant_note"), candidateId: id, version,
    participationId: id.optional(), body, supersedesNoteId: id.optional() }),
]);

export type EvaluationInput = z.output<typeof evaluationInput>;
