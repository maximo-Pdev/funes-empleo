import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as states from "@/domain/states";
import { CONTACT_CHANNELS, MODERATION_DECISIONS } from "@/domain/catalogs";
import { accountStatusLabels, companyProfileStatusLabels, candidateProfileStatusLabels, openingStatusLabels,
  participationStatusLabels, referralAccessLabels, consentStatusLabels, cvStatusLabels, importBatchStatusLabels,
  importRowStatusLabels, contactChannelLabels, moderationDecisionLabels, auditActionLabels,
  displayLabel, auditStateLabel, auditActionLabel, reasonLabel, availabilityLabel } from "@/domain/presentation/labels";

describe("etiquetas de presentación españolas", () => {
  it.each([
    [states.ACCOUNT_STATUSES, accountStatusLabels], [states.COMPANY_PROFILE_STATUSES, companyProfileStatusLabels],
    [states.CANDIDATE_PROFILE_STATUSES, candidateProfileStatusLabels], [states.OPENING_STATUSES, openingStatusLabels],
    [states.PARTICIPATION_STATUSES, participationStatusLabels], [states.REFERRAL_ACCESS_STATUSES, referralAccessLabels],
    [states.CONSENT_STATUSES, consentStatusLabels], [states.CV_STATUSES, cvStatusLabels],
    [states.IMPORT_BATCH_STATUSES, importBatchStatusLabels], [states.IMPORT_ROW_STATUSES, importRowStatusLabels],
    [CONTACT_CHANNELS, contactChannelLabels], [MODERATION_DECISIONS, moderationDecisionLabels],
  ] as const)("cubre el catálogo normativo sin modificar sus valores: %j", (codes, labels) => {
    for (const code of codes) {
      expect(Object.hasOwn(labels, code)).toBe(true);
      expect(displayLabel(labels, code)).not.toBe(code);
      expect(displayLabel(labels, code)).not.toContain("_");
    }
  });

  it("cubre las acciones de auditoría normativas", () => {
    const sql = ["202609190003_authorization_audit.sql", "202609190030_company_self_service.sql"]
      .map(file => readFileSync(`supabase/migrations/${file}`, "utf8")).join("\n");
    const constraint = [...sql.matchAll(/check\(action in\s*\(([\s\S]*?)\)\)/g)].map(match => match[1]!).join(",");
    const actions = [...constraint.matchAll(/'([^']+)'/g)].map(match => match[1]!);
    expect(actions.length).toBeGreaterThan(40);
    for (const action of actions) expect(Object.hasOwn(auditActionLabels, action)).toBe(true);
  });

  it("no filtra códigos desconocidos ni propiedades heredadas", () => {
    expect(displayLabel(accountStatusLabels, "unknown_status")).toBe("Estado no reconocido");
    expect(displayLabel(accountStatusLabels, "constructor")).toBe("Estado no reconocido");
    expect(auditStateLabel(null)).toBe("Sin cambio de estado");
    expect(auditActionLabel("unknown_action")).toBe("Evento registrado");
    expect(reasonLabel("unknown_reason")).toBe("Motivo registrado");
    expect(availabilityLabel("available")).toBe("Disponible");
    expect(availabilityLabel("unavailable")).toBe("No disponible");
    expect(availabilityLabel(null)).toBe("Sin informar");
  });
});
