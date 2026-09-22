import { describe, expect, it } from "vitest";
import {
  CONTACT_CHANNELS,
  CONTRACT_TYPE_CATALOG,
  DUPLICATE_DECISIONS,
  MODALITY_CATALOG,
  MODERATION_DECISIONS,
  PREINTERVIEW_CHANNELS,
  USER_ROLES,
  approvedCatalogValueSchema,
  parsePublicRegistrationRole,
  parseUserRole,
} from "@/domain/catalogs";
import {
  ACCOUNT_STATUSES,
  CANDIDATE_PROFILE_STATUSES,
  COMPANY_PROFILE_STATUSES,
  CONSENT_STATUSES,
  CV_STATUSES,
  EXECUTABLE_IMPORT_BATCH_STATUSES,
  EXECUTABLE_REFERRAL_ACCESS_STATUSES,
  IMPORT_BATCH_STATUSES,
  IMPORT_ROW_STATUSES,
  OPENING_STATUSES,
  PARTICIPATION_STATUSES,
  REFERRAL_ACCESS_STATUSES,
} from "@/domain/states";
import { AppError, publicErrorFrom } from "@/lib/errors/public-error";
import { cuitSchema, dniSchema, emailContactSchema, phoneContactSchema } from "@/validation/common";

describe("roles y registro público", () => {
  it("analiza solo los tres roles internos exactos", () => {
    expect(USER_ROLES).toEqual(["candidate", "company", "admin"]);
    expect(parseUserRole("admin")).toBe("admin");
    expect(parseUserRole("Admin")).toBeNull();
    expect(parseUserRole("system")).toBeNull();
    expect(parseUserRole({ role: "admin" })).toBeNull();
  });

  it("no permite crear administradores desde el autorregistro", () => {
    expect(parsePublicRegistrationRole("candidate")).toBe("candidate");
    expect(parsePublicRegistrationRole("company")).toBe("company");
    expect(parsePublicRegistrationRole("admin")).toBeNull();
  });
});

describe("errores públicos seguros", () => {
  it("traduce códigos aprobados a mensajes accionables en español", () => {
    expect(publicErrorFrom(new AppError("CONFLICT_STALE_DATA")).message).toMatch(/actualiz/i);
    expect(publicErrorFrom(new AppError("CONSENT_REQUIRED")).message).toMatch(/consentimiento/i);
    expect(publicErrorFrom(new AppError("VALID_CV_REQUIRED")).message).toMatch(/CV/i);
    expect(publicErrorFrom(new AppError("NOT_FOUND")).message).not.toMatch(/existe pero/i);
  });

  it("nunca publica mensajes arbitrarios ni detalles de errores internos", () => {
    const secret = "DNI-FICTICIO; token supersecreto";
    const result = publicErrorFrom(new Error(secret), "7f47ba50-39c7-4f59-aec8-fc0e379a4051");
    expect(result.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(result.requestId).toBe("7f47ba50-39c7-4f59-aec8-fc0e379a4051");
    expect(publicErrorFrom(new Error(secret), secret).requestId).toBeUndefined();
    expect(publicErrorFrom({ code: "NOT_FOUND", message: secret }).code).toBe("INTERNAL_ERROR");
  });
});

describe("normalización de identificadores y contactos", () => {
  it("normaliza DNI y CUIT sin borrar letras inválidas silenciosamente", () => {
    expect(dniSchema.parse("00.000.000")).toBe("00000000");
    expect(cuitSchema.parse("00-00000000-0")).toBe("00000000000");
    expect(dniSchema.safeParse("00A00000").success).toBe(false);
    expect(cuitSchema.safeParse("00-00X00000-0").success).toBe(false);
  });

  it("normaliza email y teléfono sin convertir datos de otro tipo", () => {
    expect(emailContactSchema.parse("  Persona@EJEMPLO.test  ")).toBe("persona@ejemplo.test");
    expect(phoneContactSchema.parse("+00 (000) 000-0000")).toBe("+000000000000");
    expect(phoneContactSchema.safeParse("llamar mañana").success).toBe(false);
    expect(emailContactSchema.safeParse("no-es-un-correo").success).toBe(false);
  });
});

describe("catálogos y estados normativos", () => {
  it("mantiene separados estados de cuenta, perfiles, oferta y participación", () => {
    expect(ACCOUNT_STATUSES).toEqual(["pending_verification", "active", "suspended", "archived"]);
    expect(COMPANY_PROFILE_STATUSES).toEqual(["incomplete", "active", "suspended", "archived"]);
    expect(CANDIDATE_PROFILE_STATUSES).toEqual(["draft", "active", "needs_update", "unavailable", "consent_withdrawn", "archived"]);
    expect(OPENING_STATUSES).toEqual(["draft", "pending_review", "changes_requested", "published", "paused", "closed", "rejected", "suspended", "cancelled"]);
    expect(PARTICIPATION_STATUSES).toEqual(["received", "under_review", "preinterview", "preselected", "referred", "company_interview", "awaiting_feedback", "hired", "not_selected", "withdrawn", "cancelled", "no_company_response"]);
    expect(OPENING_STATUSES).not.toContain("archived_at");
  });

  it("incluye estados reservados sin tratarlos como decisiones ejecutables", () => {
    expect(REFERRAL_ACCESS_STATUSES).toEqual(["active", "revoked", "expired_by_policy"]);
    expect(EXECUTABLE_REFERRAL_ACCESS_STATUSES).not.toContain("expired_by_policy");
    expect(CONSENT_STATUSES).toEqual(["accepted", "withdrawn"]);
    expect(CV_STATUSES).toEqual(["valid", "superseded", "rejected", "archived"]);
    expect(IMPORT_BATCH_STATUSES).toEqual(["uploaded", "preview_ready", "blocked", "confirming", "completed", "failed", "archived"]);
    expect(EXECUTABLE_IMPORT_BATCH_STATUSES).not.toContain("archived");
    expect(IMPORT_ROW_STATUSES).toEqual(["valid", "warning", "invalid", "potential_duplicate", "unmapped_category", "imported"]);
  });

  it("separa códigos de moderación de estados y controla decisiones y canales", () => {
    expect(MODERATION_DECISIONS).toContain("auto_closed");
    expect(MODERATION_DECISIONS).toContain("restored_to_draft");
    expect(OPENING_STATUSES).not.toContain("auto_closed");
    expect(DUPLICATE_DECISIONS).toEqual(["use_or_update_existing", "correct_and_create", "reject"]);
    expect(CONTACT_CHANNELS).toEqual(["phone", "email", "whatsapp", "in_person"]);
    expect(PREINTERVIEW_CHANNELS).toContain("video");
  });

  it("no inventa valores de modalidad ni contrato: exige el catálogo aprobado", () => {
    expect(MODALITY_CATALOG.kind).toBe("modality");
    expect(CONTRACT_TYPE_CATALOG.kind).toBe("contract_type");
    expect(approvedCatalogValueSchema(MODALITY_CATALOG, []).safeParse("remote").success).toBe(false);
    expect(approvedCatalogValueSchema(MODALITY_CATALOG, ["codigo_aprobado"]).safeParse("codigo_aprobado").success).toBe(true);
    expect(approvedCatalogValueSchema(CONTRACT_TYPE_CATALOG, ["codigo_aprobado"]).safeParse("otro").success).toBe(false);
  });
});
