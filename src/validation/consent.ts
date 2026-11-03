import { z } from "zod";

export const consentChangeSchema = z.object({
  version: z.coerce.number().int().positive(),
  status: z.literal("accepted"),
  confirmed: z.literal(true),
});
