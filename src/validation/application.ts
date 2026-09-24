import { z } from "zod";
import { databaseUuidSchema } from "./common";

export const applicationSchema = z.object({
  openingId: databaseUuidSchema, candidateVersion: z.coerce.number().int().positive(),
});
export const withdrawalSchema = z.object({
  participationId: databaseUuidSchema, version: z.coerce.number().int().positive(),
  confirmed: z.literal(true),
});
