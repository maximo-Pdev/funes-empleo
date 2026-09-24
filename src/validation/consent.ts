import { z } from "zod";

export const consentChangeSchema = z.object({
  version: z.coerce.number().int().positive(),
  status: z.enum(["accepted", "withdrawn"]),
  confirmed: z.literal(true),
});
