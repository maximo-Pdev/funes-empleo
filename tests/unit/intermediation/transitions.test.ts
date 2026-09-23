import { describe, expect, it } from "vitest";
import {
  decideOpeningTransition,
  isOpeningExpired,
} from "@/domain/transitions/opening";
import {
  decideParticipationTransition,
  isFeedbackOverdue,
  canReadReferredData,
} from "@/domain/transitions/participation";

const instant = new Date("2026-09-20T03:00:00.000Z");

describe("transiciones de oferta", () => {
  const base = {
    actor: "admin" as const,
    status: "pending_review" as const,
    version: 2,
    expectedVersion: 2,
    complete: true,
    companyActive: true,
    archived: false,
    closingDate: "2026-09-20",
    now: instant,
  };

  it("reserva publicación y moderación para la Oficina", () => {
    expect(decideOpeningTransition({ ...base, command: "approve" }).nextStatus).toBe("published");
    expect(() => decideOpeningTransition({ ...base, actor: "company", command: "approve" })).toThrow("ACCESS_DENIED");
    expect(() => decideOpeningTransition({ ...base, command: "reject", reason: "Motivo interno" })).toThrow("VALIDATION_ERROR");
    expect(decideOpeningTransition({ ...base, command: "reject", reason: "Motivo interno", companyMessage: "Corregí la oferta" }).nextStatus).toBe("rejected");
  });

  it("valida versión, completitud y estado antes de enviar", () => {
    expect(decideOpeningTransition({ ...base, actor: "company", status: "draft", command: "submit" }).nextStatus).toBe("pending_review");
    expect(() => decideOpeningTransition({ ...base, actor: "company", status: "draft", command: "submit", complete: false })).toThrow("VALIDATION_ERROR");
    expect(() => decideOpeningTransition({ ...base, expectedVersion: 1, command: "approve" })).toThrow("CONFLICT_STALE_DATA");
    expect(() => decideOpeningTransition({ ...base, status: "closed", command: "approve" })).toThrow("INVALID_TRANSITION");
  });

  it("pausa y cierra sin finalizar participaciones; cancelar sí las finaliza", () => {
    const published = { ...base, status: "published" as const, reason: "Motivo operativo" };
    expect(decideOpeningTransition({ ...published, command: "pause" })).toMatchObject({ nextStatus: "paused", cancelOpenParticipations: false });
    expect(decideOpeningTransition({ ...published, command: "close" })).toMatchObject({ nextStatus: "closed", cancelOpenParticipations: false });
    expect(decideOpeningTransition({ ...published, command: "cancel" })).toMatchObject({ nextStatus: "cancelled", cancelOpenParticipations: true });
    expect(() => decideOpeningTransition({ ...published, command: "pause", reason: "" })).toThrow("VALIDATION_ERROR");
  });

  it("suspensión y restauración devuelven a borrador, nunca a publicado", () => {
    const suspended = decideOpeningTransition({ ...base, status: "published", command: "suspend", reason: "Oferta inapropiada" });
    expect(suspended.nextStatus).toBe("suspended");
    expect(decideOpeningTransition({ ...base, status: "suspended", command: "restore_to_draft", reason: "Nueva revisión" }).nextStatus).toBe("draft");
  });

  it("usa el fin de la fecha local de Buenos Aires como límite exclusivo", () => {
    expect(isOpeningExpired("2026-09-19", new Date(instant.getTime() - 1))).toBe(false);
    expect(isOpeningExpired("2026-09-19", instant)).toBe(true);
    expect(decideOpeningTransition({ ...base, actor: "system", status: "published", command: "auto_close", closingDate: "2026-09-19" }).nextStatus).toBe("closed");
    expect(() => decideOpeningTransition({ ...base, actor: "system", status: "published", command: "auto_close" })).toThrow("INVALID_TRANSITION");
  });
});

describe("transiciones de participación", () => {
  const base = {
    actor: "admin" as const,
    status: "received" as const,
    version: 3,
    expectedVersion: 3,
    candidateActive: true,
    companyActive: true,
    openingTreatable: true,
    consentCurrent: true,
    validCv: true,
    now: instant,
  };

  it("permite omitir etapas internas solo hacia adelante y con motivo", () => {
    expect(decideParticipationTransition({ ...base, command: "preselect", reason: "Evaluación documentada" })).toMatchObject({ nextStatus: "preselected", skippedStages: ["under_review", "preinterview"] });
    expect(() => decideParticipationTransition({ ...base, command: "preselect" })).toThrow("VALIDATION_ERROR");
    expect(() => decideParticipationTransition({ ...base, status: "preselected", command: "review" })).toThrow("INVALID_TRANSITION");
  });

  it("nunca omite la derivación municipal ni la habilita sin consentimiento y CV", () => {
    expect(() => decideParticipationTransition({ ...base, command: "interview" })).toThrow("INVALID_TRANSITION");
    expect(() => decideParticipationTransition({ ...base, actor: "company", command: "refer" })).toThrow("ACCESS_DENIED");
    expect(() => decideParticipationTransition({ ...base, command: "refer", consentCurrent: false, reason: "Salto justificado" })).toThrow("CONSENT_REQUIRED");
    expect(() => decideParticipationTransition({ ...base, command: "refer", validCv: false, reason: "Salto justificado" })).toThrow("VALID_CV_REQUIRED");
    expect(decideParticipationTransition({ ...base, command: "refer", reason: "Salto justificado" })).toMatchObject({ nextStatus: "referred", createsReferral: true });
  });

  it("admite retiro propio de nominación y retiro administrativo solo a pedido", () => {
    expect(decideParticipationTransition({ ...base, actor: "candidate", command: "withdraw", origin: "admin_nomination" })).toMatchObject({ nextStatus: "withdrawn", revokeAccess: true });
    expect(() => decideParticipationTransition({ ...base, command: "withdraw" })).toThrow("INVALID_TRANSITION");
    expect(decideParticipationTransition({ ...base, command: "withdraw", candidateRequestRecorded: true })).toMatchObject({ nextStatus: "withdrawn", revokeAccess: true });
  });

  it("cancelación individual motivada no cancela la oferta", () => {
    expect(() => decideParticipationTransition({ ...base, command: "cancel" })).toThrow("VALIDATION_ERROR");
    expect(decideParticipationTransition({ ...base, command: "cancel", reason: "Caso individual" })).toMatchObject({ nextStatus: "cancelled", revokeAccess: true });
  });

  it("cierra sin respuesta a 720 horas exactas y nunca reinicia el reloj por seguimiento", () => {
    const referredAt = new Date("2026-08-21T03:00:00.000Z");
    expect(isFeedbackOverdue(referredAt, new Date(instant.getTime() - 1))).toBe(false);
    expect(isFeedbackOverdue(referredAt, instant)).toBe(true);
    expect(decideParticipationTransition({ ...base, actor: "system", status: "awaiting_feedback", command: "no_response", referredAt })).toMatchObject({ nextStatus: "no_company_response", revokeAccess: true });
  });

  it("contratación mantiene solo un permiso vigente por 720 horas desde confirmación", () => {
    const hired = decideParticipationTransition({ ...base, status: "referred", command: "hire", referralAccess: "active" });
    expect(hired.postHireAccessUntil).toBe("2026-10-20T03:00:00.000Z");
    expect(decideParticipationTransition({ ...base, status: "referred", command: "hire", referralAccess: "revoked" }).postHireAccessUntil).toBeNull();
    expect(canReadReferredData({ accessStatus: "active", consentCurrent: true, accountsActive: true, recordsActive: true, status: "hired", postHireAccessUntil: new Date("2026-10-20T03:00:00.000Z"), now: new Date("2026-10-20T03:00:00.000Z") })).toBe(false);
  });

  it("corrige solo el cierre automático con evidencia y conserva el acceso revocado", () => {
    const closed = { ...base, status: "no_company_response" as const, referralAccess: "revoked" as const };
    expect(() => decideParticipationTransition({ ...closed, command: "late_hire" })).toThrow("VALIDATION_ERROR");
    expect(decideParticipationTransition({ ...closed, command: "late_hire", evidence: "portal_feedback", reason: "Respuesta tardía" })).toMatchObject({ nextStatus: "hired", preservePriorClosure: true, postHireAccessUntil: null });
    expect(decideParticipationTransition({ ...closed, command: "late_not_selected", evidence: "municipal_contact", reason: "Respuesta tardía" })).toMatchObject({ nextStatus: "not_selected", preservePriorClosure: true });
    expect(decideParticipationTransition({ ...closed, command: "late_cancel", evidence: "portal_feedback", reason: "Respuesta tardía" })).toMatchObject({ nextStatus: "cancelled", preservePriorClosure: true });
  });

  it("rechaza versiones obsoletas antes de mutar", () => {
    expect(() => decideParticipationTransition({ ...base, expectedVersion: 2, command: "review" })).toThrow("CONFLICT_STALE_DATA");
  });
});
