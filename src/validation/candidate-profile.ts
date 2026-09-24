import { z } from "zod";
import { databaseUuidSchema } from "./common";

const uuid = databaseUuidSchema;
export const candidateProfileSchema = z.object({
  version: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(200),
  dni: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().regex(/^\d{7,8}$/)),
  locality: z.string().trim().max(150),
  summary: z.string().trim().max(5000),
  availability: z.enum(["available", "unavailable"]),
  detail: z.string().trim().max(500),
  address: z.string().trim().max(500),
  categories: z.array(uuid).max(20).refine((ids) => new Set(ids).size === ids.length),
});
export const phoneSchema = z.object({
  version: z.coerce.number().int().positive(),
  phone: z.string().trim().max(50).refine((value) => !value || /^[+0-9() -]{6,50}$/.test(value)),
});
export const candidateVersionSchema = z.object({ version: z.coerce.number().int().positive() });
export const candidateArchiveSchema = candidateVersionSchema.extend({ confirmed: z.literal(true) });
export const candidateRestoreSchema = z.object({
  accountId: uuid, version: z.coerce.number().int().positive(),
  reason: z.string().trim().min(1).max(500), confirmed: z.literal(true),
});
