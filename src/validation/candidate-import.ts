import { z } from "zod";
import { databaseUuidSchema } from "./common";
import { IMPORT_FIELDS, IMPORT_MAPPING } from "@/features/imports/mapping";
export const importConfirmationSchema = z.object({ version: z.number().int().positive(),
  hash: z.string().regex(/^[a-f0-9]{64}$/), mapping: z.literal(IMPORT_MAPPING) }).strict();
export const importCorrectionSchema = z.object({ name: z.string().max(200), dni: z.string().max(20),
  email: z.string().max(320), phone: z.string().max(50), locality: z.string().max(150),
  categories: z.array(z.string().max(100)).max(20), summary: z.string().max(5000),
  availability: z.string().max(100), reference: z.string().max(100) }).strict();
export const importResolutionSchema = z.object({ batchId: databaseUuidSchema, rowId: databaseUuidSchema,
  version: z.number().int().positive(), decision: z.enum(["use_or_update_existing", "correct_and_create", "reject"]),
  reason: z.string().trim().min(1).max(1000), data: importCorrectionSchema.nullable(),
  candidateId: databaseUuidSchema.nullable(), candidateVersion: z.number().int().positive().nullable(),
  fields: z.array(z.enum(IMPORT_FIELDS)).max(IMPORT_FIELDS.length) }).strict();
