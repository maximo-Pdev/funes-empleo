import { z } from "zod";
import { databaseUuidSchema } from "./common";
import { isRecordReference } from "@/lib/records/reference-format";

// Deliberately lexical: user-supplied links are never fetched by the server.
// No municipal domain allowlist is invented; staff verify the official source.
export const courseUrlSchema = z.string().max(2048).regex(
  /^https:\/\/(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}(?:[/?#][^\s\\]*)?$/i,
).refine(value => !/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value));
export const courseLinkSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: courseUrlSchema,
  published: z.boolean().default(true),
  courseId: databaseUuidSchema.optional(),
});
export const courseReferralSchema = z.object({
  candidateReference: z.string().refine(value => isRecordReference("candidate", value)),
  courseId: databaseUuidSchema,
});
