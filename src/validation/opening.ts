import { z } from "zod";
import { databaseUuidSchema } from "./common";

const optionalText = (limit: number) => z.string().trim().max(limit);
export const openingDraftSchema = z.object({
  id: databaseUuidSchema.optional(),
  version: z.coerce.number().int().positive().optional(),
  title: optionalText(200),
  tasks: optionalText(5000),
  requirements: optionalText(5000),
  vacancies: z.union([z.literal(""), z.null(), z.coerce.number().int().positive()]).optional(),
  location: optionalText(200),
  modality: optionalText(100),
  schedule: optionalText(500),
  contractType: optionalText(100),
  closingDate: z.union([z.literal(""), z.iso.date()]),
  salary: optionalText(500),
  benefits: optionalText(2000),
  categories: z.array(databaseUuidSchema).max(20),
}).superRefine((value, context) => {
  if (new Set(value.categories).size !== value.categories.length) context.addIssue({ code: "custom", path: ["categories"], message: "Categorías repetidas." });
  if (value.id && !value.version) context.addIssue({ code: "custom", path: ["version"], message: "Falta la versión." });
});

export const openingSubmitSchema = z.object({
  id: databaseUuidSchema,
  version: z.coerce.number().int().positive(),
});
