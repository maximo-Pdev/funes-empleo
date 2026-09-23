import { z } from "zod";

const id = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const decision = z.enum(["approved", "changes_requested", "rejected", "paused", "resumed",
  "closed", "suspended", "restored_to_draft", "cancelled"]);
const needsPublicMessage = new Set(["changes_requested", "rejected"]);
const needsInternalReason = new Set(["rejected", "paused", "closed", "suspended", "restored_to_draft", "cancelled"]);

export const openingModerationInput = z.object({
  openingId: id,
  version: z.coerce.number().int().positive(),
  decision,
  publicMessage: z.string().trim().max(2000).default(""),
  internalReason: z.string().trim().max(1000).default(""),
  confirmed: z.boolean().default(false),
}).superRefine((value, context) => {
  if (needsPublicMessage.has(value.decision) && !value.publicMessage) {
    context.addIssue({ code: "custom", path: ["publicMessage"], message: "Ingresá una explicación accionable para la empresa." });
  }
  if (needsInternalReason.has(value.decision) && !value.internalReason) {
    context.addIssue({ code: "custom", path: ["internalReason"], message: "Ingresá un motivo interno." });
  }
  if (value.decision === "suspended" && !value.confirmed) {
    context.addIssue({ code: "custom", path: ["confirmed"], message: "Confirmá la suspensión." });
  }
}).transform((value) => ({
  ...value,
  publicMessage: needsPublicMessage.has(value.decision) ? value.publicMessage : "",
  internalReason: needsInternalReason.has(value.decision) || value.decision === "changes_requested" ? value.internalReason : "",
}));

export type OpeningModerationInput = z.output<typeof openingModerationInput>;
