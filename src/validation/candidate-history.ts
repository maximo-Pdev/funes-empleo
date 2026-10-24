import { z } from "zod";
import { databaseUuidSchema } from "./common";
import { candidateHistoryActions } from "@/features/candidates/candidate-history";

const timestamp = z.iso.datetime({ offset: true });
export const candidateHistoryCursorSchema = z.object({ occurredAt: timestamp, id: databaseUuidSchema }).strict();
export const candidateHistoryQuerySchema = z.object({
  candidateId: databaseUuidSchema,
  cursor: candidateHistoryCursorSchema.nullable().default(null),
}).strict();
export const candidateHistoryEventsSchema = z.array(z.object({
  id: databaseUuidSchema, action: z.enum(candidateHistoryActions), occurred_at: timestamp,
}));
