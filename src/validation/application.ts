import { z } from "zod";

export const applicationSchema = z.object({
  openingId: z.guid(), candidateVersion: z.coerce.number().int().positive(),
});
export const withdrawalSchema = z.object({
  participationId: z.guid(), version: z.coerce.number().int().positive(),
  confirmed: z.literal(true),
});
