import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUSES, CANDIDATE_PROFILE_STATUSES, COMPANY_PROFILE_STATUSES, CONSENT_STATUSES,
  CV_STATUSES, IMPORT_BATCH_STATUSES, OPENING_STATUSES, PARTICIPATION_STATUSES, REFERRAL_ACCESS_STATUSES }
  from "@/domain/states";
import { accountStatusTones, availabilityTones, candidateProfileStatusTones, companyProfileStatusTones,
  consentStatusTones, cvStatusTones, feedbackReviewTones, importBatchStatusTones, interviewStatusTones,
  openingStatusTones, participationStatusTones, referralAccessTones, statusTone }
  from "@/domain/presentation/status-tone";

const TONES = ["green", "red", "amber", "blue", "violet", "neutral"];

describe("catálogo de tonos por estado", () => {
  it("asigna un tono conocido a cada estado de cada catálogo del dominio", () => {
    const catalogs = [
      [ACCOUNT_STATUSES, accountStatusTones],
      [COMPANY_PROFILE_STATUSES, companyProfileStatusTones],
      [CANDIDATE_PROFILE_STATUSES, candidateProfileStatusTones],
      [OPENING_STATUSES, openingStatusTones],
      [PARTICIPATION_STATUSES, participationStatusTones],
      [REFERRAL_ACCESS_STATUSES, referralAccessTones],
      [CONSENT_STATUSES, consentStatusTones],
      [CV_STATUSES, cvStatusTones],
      [IMPORT_BATCH_STATUSES, importBatchStatusTones],
    ] as const;
    for (const [statuses, tones] of catalogs) {
      for (const status of statuses) {
        expect(TONES, `${status} sin tono`).toContain((tones as Record<string, string>)[status]);
      }
      expect(Object.keys(tones).sort()).toEqual([...statuses].sort());
    }
  });

  it("mantiene el mapeo aprobado para los casos que la Oficina distingue", () => {
    expect(openingStatusTones.published).toBe("green");
    expect(openingStatusTones.rejected).toBe("red");
    expect(openingStatusTones.suspended).toBe("red");
    expect(openingStatusTones.closed).toBe("neutral");
    expect(participationStatusTones.referred).toBe("violet");
    expect(participationStatusTones.awaiting_feedback).toBe("amber");
    expect(participationStatusTones.hired).toBe("green");
    expect(participationStatusTones.not_selected).toBe("neutral");
    expect(accountStatusTones.pending_verification).toBe("amber");
    expect(consentStatusTones.withdrawn).toBe("red");
    expect(cvStatusTones.valid).toBe("green");
    expect(importBatchStatusTones.blocked).toBe("red");
    expect(interviewStatusTones.no_show).toBe("red");
    expect(feedbackReviewTones.pending_admin).toBe("amber");
    expect(availabilityTones.available).toBe("green");
  });

  it("resuelve el tono con respaldo neutro para estados ausentes o desconocidos", () => {
    expect(statusTone(openingStatusTones, "published")).toBe("green");
    expect(statusTone(openingStatusTones, "estado_inventado")).toBe("neutral");
    expect(statusTone(openingStatusTones, null)).toBe("neutral");
    expect(statusTone(openingStatusTones, undefined)).toBe("neutral");
    expect(statusTone(availabilityTones, "available")).toBe("green");
    expect(statusTone(availabilityTones, "")).toBe("neutral");
  });
});
