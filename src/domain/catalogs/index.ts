import { z } from "zod";

// These are domain values, not a source of authorization. Server/database guards
// must derive the current role from the authenticated account on every request.
export const USER_ROLES = ["candidate", "company", "admin"] as const;
export const PUBLIC_REGISTRATION_ROLES = [USER_ROLES[0], USER_ROLES[1]] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type PublicRegistrationRole = (typeof PUBLIC_REGISTRATION_ROLES)[number];

export const userRoleSchema = z.enum(USER_ROLES);
export const publicRegistrationRoleSchema = z.enum(PUBLIC_REGISTRATION_ROLES);

export function parseUserRole(value: unknown): UserRole | null {
  const result = userRoleSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function parsePublicRegistrationRole(value: unknown): PublicRegistrationRole | null {
  const result = publicRegistrationRoleSchema.safeParse(value);
  return result.success ? result.data : null;
}

export const DUPLICATE_DECISIONS = ["use_or_update_existing", "correct_and_create", "reject"] as const;
export const MODERATION_DECISIONS = [
  "submitted", "approved", "changes_requested", "rejected", "paused", "resumed",
  "closed", "auto_closed", "suspended", "restored_to_draft", "cancelled",
] as const;
export const CONTACT_KINDS = ["email", "phone", "other_approved"] as const;
export const CONTACT_CHANNELS = ["phone", "email", "whatsapp", "in_person"] as const;
export const PREINTERVIEW_CHANNELS = [...CONTACT_CHANNELS, "video"] as const;

export const duplicateDecisionSchema = z.enum(DUPLICATE_DECISIONS);
export const moderationDecisionSchema = z.enum(MODERATION_DECISIONS);
export const contactKindSchema = z.enum(CONTACT_KINDS);
export const contactChannelSchema = z.enum(CONTACT_CHANNELS);
export const preinterviewChannelSchema = z.enum(PREINTERVIEW_CHANNELS);

// OQ-010/OQ-011 do not approve concrete municipal values for these catalogs.
// A caller must supply currently approved codes (for example, from an active
// versioned database catalog); an empty set intentionally rejects every value.
export const MODALITY_CATALOG = { kind: "modality" } as const;
export const CONTRACT_TYPE_CATALOG = { kind: "contract_type" } as const;
export type DeferredCatalog = typeof MODALITY_CATALOG | typeof CONTRACT_TYPE_CATALOG;

export function approvedCatalogValueSchema(
  catalog: DeferredCatalog,
  approvedCodes: readonly string[],
) {
  const allowed = new Set(approvedCodes);
  const label = catalog.kind === "modality" ? "modalidad" : "tipo de contratación";
  return z.string().trim().refine((value) => allowed.has(value), {
    message: `Seleccioná una ${label} vigente del catálogo aprobado.`,
  });
}
