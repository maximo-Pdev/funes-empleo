import { describe, expect, it } from "vitest";
import { openingModerationInput } from "@/validation/opening-moderation";
import { evaluationInput } from "@/validation/evaluation";
import { accountCommandInput } from "@/features/accounts/input";

const id = "00000000-0000-0000-0000-000000000001";

describe("validaciones de acciones administrativas", () => {
  it("acepta los UUID MD5 del fixture local en acciones de cuenta", () => {
    expect(accountCommandInput.safeParse({ accountId: "2ea4cdc3-2bde-90ca-b1b3-fe159516a9fd",
      version: 1, command: "suspend", reason: "Prueba ficticia", confirmed: true }).success).toBe(true);
  });
  it("separa explicación visible y motivo interno en moderación", () => {
    const base = { openingId: id, version: 2 };
    expect(openingModerationInput.safeParse({ ...base, decision: "changes_requested", publicMessage: "" }).success).toBe(false);
    expect(openingModerationInput.safeParse({ ...base, decision: "rejected", publicMessage: "Corregí los requisitos.", internalReason: "" }).success).toBe(false);
    expect(openingModerationInput.safeParse({ ...base, decision: "paused", publicMessage: "Texto que no debe verse", internalReason: "Revisión interna" }).success).toBe(true);
    expect(openingModerationInput.parse({ ...base, decision: "paused", publicMessage: "Texto que no debe verse", internalReason: "Revisión interna" }).publicMessage).toBe("");
    expect(openingModerationInput.safeParse({ ...base, decision: "approved" }).success).toBe(true);
  });

  it("exige confirmación explícita para suspensión y motivo para restaurar", () => {
    const base = { openingId: id, version: 1, decision: "suspended", internalReason: "Motivo" };
    expect(openingModerationInput.safeParse(base).success).toBe(false);
    expect(openingModerationInput.safeParse({ ...base, confirmed: true }).success).toBe(true);
    expect(openingModerationInput.safeParse({ ...base, decision: "restored_to_draft", internalReason: "" }).success).toBe(false);
  });

  it("valida preentrevista y contacto sin aceptar canales inventados", () => {
    expect(evaluationInput.safeParse({ command: "record_preinterview", participationId: id, version: 1, channel: "phone", summary: "Conversación ficticia" }).success).toBe(true);
    expect(evaluationInput.parse({ command: "record_preinterview", participationId: id, version: 1, channel: "phone", reason: "Salto justificado" })).toMatchObject({ reason: "Salto justificado" });
    expect(evaluationInput.safeParse({ command: "record_preinterview", participationId: id, version: 1, channel: "telegram", summary: "Conversación ficticia" }).success).toBe(false);
    expect(evaluationInput.safeParse({ command: "record_contact", participationId: id, channel: "whatsapp", occurredAt: "2026-09-23T15:00:00Z", summary: "Seguimiento ficticio" }).success).toBe(true);
    expect(evaluationInput.safeParse({ command: "record_contact", channel: "phone", occurredAt: "2026-09-23T15:00:00Z", summary: "Sin entidad" }).success).toBe(false);
  });

  it("exige motivo para saltar etapas y admite notas internas breves", () => {
    expect(evaluationInput.safeParse({ command: "skip_to_preselected", participationId: id, version: 2, reason: "" }).success).toBe(false);
    expect(evaluationInput.safeParse({ command: "skip_to_preselected", participationId: id, version: 2, reason: "Evaluación documentada" }).success).toBe(true);
    expect(evaluationInput.safeParse({ command: "record_training_guidance", candidateId: id, body: "Orientación ficticia" }).success).toBe(true);
    expect(evaluationInput.safeParse({ command: "record_applicant_note", participationId: id, body: "" }).success).toBe(false);
  });
});
