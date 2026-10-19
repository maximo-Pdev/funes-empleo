import { z } from "zod";

export const publicOfferSearchSchema = z.object({
  q: z.string().trim().max(120).default(""),
  rubro: z.string().trim().max(50).default(""),
  localidad: z.string().trim().max(200).toLowerCase().default(""),
  modalidad: z.string().trim().max(100).toLowerCase().default(""),
  page: z.union([z.string(), z.number()]).transform(value => Number(value)).pipe(z.number().int().min(1).max(10000)).default(1),
  pageSize: z.union([z.string(), z.number()]).transform(value => Number(value)).pipe(z.number().int().min(1).max(30)).default(10),
});
export type PublicOfferSearch = z.infer<typeof publicOfferSearchSchema>;
