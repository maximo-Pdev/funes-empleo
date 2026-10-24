import { z } from "zod";
import { duplicateDecisionSchema } from "@/domain/catalogs";
import { candidateProfileSchema } from "./candidate-profile";
import { databaseUuidSchema } from "./common";
export const assistedFields = ["name", "dni", "phone", "email", "locality", "summary", "availability", "detail", "address", "categories"] as const;
export const assistedProfileSchema = candidateProfileSchema.omit({ version: true }).extend({
  phone: z.string().trim().max(50).refine((s) => !s || /^[+0-9() -]{6,50}$/.test(s)),
  email: z.union([z.literal(""), z.email().max(320)]).transform((s) => s.toLowerCase()),
  // Accept only an empty legacy payload; never discard a stored selection silently.
  interests: z.array(z.never()).max(0).optional(),
}).refine((s) => Boolean(s.phone || s.email), { message: "Ingresá al menos un contacto." })
  .transform(({ interests, ...data }) => { void interests; return data; });
export const duplicateResolutionSchema = z.object({
  reviewId: databaseUuidSchema, decision: duplicateDecisionSchema,
  reason: z.string().trim().min(1).max(1000),
  confirmedFields: z.array(z.enum(assistedFields)).default([]),
});
export const claimSchema = z.object({
  candidateId: databaseUuidSchema, version: z.coerce.number().int().positive(), accountId: databaseUuidSchema,
  dni: candidateProfileSchema.shape.dni, verifiedInPerson: z.literal(true),
  reason: z.string().trim().max(1000).default(""),
});
export type AssistedInput = z.infer<typeof assistedProfileSchema>;
