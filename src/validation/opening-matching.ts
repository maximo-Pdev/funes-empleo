import { z } from "zod";
import { databaseUuidSchema } from "./common";

const integerInput = (maximum: number, fallback: number) => z.union([z.string().regex(/^\d+$/), z.number()])
  .transform(Number).pipe(z.number().int().min(1).max(maximum)).default(fallback);

export const openingMatchingInput = z.object({
  openingId: databaseUuidSchema,
  page: integerInput(10000, 1),
  pageSize: integerInput(50, 20),
});

export const openingMatchesSchema = z.object({
  available: z.boolean(), total: z.number().int().nonnegative(),
  page: z.number().int().min(1), pageSize: z.number().int().min(1).max(50),
  items: z.array(z.object({
    id: databaseUuidSchema, displayName: z.string(), locality: z.string().nullable(),
    matchedCategories: z.array(z.object({ code: z.string(), name: z.string() })).min(1),
    participationId: databaseUuidSchema.nullable(),
  })),
});

export type OpeningMatches = z.infer<typeof openingMatchesSchema>;

export const openingCandidatePreviewInput = z.object({ openingId: databaseUuidSchema, candidateId: databaseUuidSchema });
export const openingCandidatePreviewSchema = z.object({
  id: databaseUuidSchema, displayName: z.string(), locality: z.string().nullable(), skills: z.string().nullable(),
  availability: z.literal("available"), refreshDueAt: z.iso.datetime({ offset: true }),
  candidateVersion: z.number().int().positive(), cvId: databaseUuidSchema,
  openingId: databaseUuidSchema, openingTitle: z.string(), openingVersion: z.number().int().positive(),
  matchedCategories: z.array(z.object({ code: z.string(), name: z.string() })).min(1),
  categories: z.array(z.object({ code: z.string(), name: z.string(), kind: z.literal("occupation") })),
});
export type OpeningCandidatePreview = z.infer<typeof openingCandidatePreviewSchema>;
