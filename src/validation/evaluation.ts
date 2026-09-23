import { z } from "zod";
import { CONTACT_CHANNELS, PREINTERVIEW_CHANNELS } from "@/domain/catalogs";

const id = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const version = z.coerce.number().int().positive();
const internalText = z.string().trim().max(5000).default("");
const reason = z.string().trim().min(1, "Ingresá el motivo del salto.").max(1000);
const instant = z.string().regex(/(?:Z|[+-]\d{2}:\d{2})$/).refine((value) => !Number.isNaN(Date.parse(value)));

export const evaluationInput = z.discriminatedUnion("command", [
  z.object({ command: z.literal("start_review"), participationId: id, version }),
  z.object({ command: z.literal("record_preinterview"), participationId: id, version,
    channel: z.enum(PREINTERVIEW_CHANNELS), summary: internalText,
    reason: z.string().trim().max(1000).optional(),
    scheduledAt: instant.optional(), heldAt: instant.optional() }),
  z.object({ command: z.literal("preselect"), participationId: id, version,
    reason: z.string().trim().max(1000).optional() }),
  z.object({ command: z.enum(["skip_to_preinterview", "skip_to_preselected"]),
    participationId: id, version, reason }),
  z.object({ command: z.literal("mark_awaiting_feedback"), participationId: id, version }),
  z.object({ command: z.literal("record_contact"), candidateId: id.optional(),
    companyId: id.optional(), openingId: id.optional(), participationId: id.optional(),
    channel: z.enum(CONTACT_CHANNELS), occurredAt: instant, summary: internalText,
    direction: z.enum(["inbound", "outbound"]).default("outbound") })
    .refine((value) => Boolean(value.candidateId || value.companyId || value.openingId || value.participationId),
      "Indicá el registro relacionado con el contacto."),
  z.object({ command: z.literal("record_training_guidance"), candidateId: id,
    body: z.string().trim().min(1).max(5000) }),
  z.object({ command: z.literal("record_applicant_note"), candidateId: id.optional(),
    participationId: id.optional(), body: z.string().trim().min(1).max(5000) })
    .refine((value) => Boolean(value.candidateId || value.participationId),
      "Indicá el perfil o la participación relacionada."),
]);

export type EvaluationInput = z.output<typeof evaluationInput>;
