import { z } from "zod";

const scalar = (value: unknown) => Array.isArray(value) ? value[0] : value;
const optionalText = (maximum: number) => z.preprocess((value) => {
  const text = scalar(value);
  return typeof text === "string" && text.trim() === "" ? undefined : text;
}, z.string().trim().max(maximum).regex(/^[\p{L}\p{N}\s'’-]+$/u, "Usá letras, números y espacios.").optional());
const optionalId = z.preprocess((value) => {
  const text = scalar(value);
  return text === "" ? undefined : text;
}, z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).optional());
const pageNumber = (defaultValue: number, maximum: number) => z.preprocess(
  (value) => scalar(value), z.coerce.number().int().min(1).max(maximum).default(defaultValue),
);

export const candidateSearchSchema = z.object({
  term: optionalText(100),
  categoryId: optionalId,
  skills: optionalText(100),
  availability: optionalText(100),
  locality: optionalText(100),
  vigency: z.enum(["current", "needs_update", "all"]).default("current"),
  eligibility: z.enum(["eligible", "ineligible", "all"]).default("eligible"),
  page: pageNumber(1, 1000),
  pageSize: pageNumber(20, 50),
});

export type CandidateSearchFilters = z.infer<typeof candidateSearchSchema>;
