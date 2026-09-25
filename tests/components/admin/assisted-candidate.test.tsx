import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { assistedProfileSchema, claimSchema, duplicateResolutionSchema } from "@/validation/duplicate-resolution";
import { referralEligibility } from "@/domain/permissions/referral";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/features/candidates/assisted-actions", () => ({ saveAssistedAction: vi.fn(), assistedCommandAction: vi.fn() }));
vi.mock("@/features/candidates/claim-actions", () => ({ claimAssistedAction: vi.fn() }));
import { AssistedProfileForm, ClaimForm } from "@/features/candidates/components/assisted/assisted-forms";
const id = "04000000-0000-4000-8000-000000000001";
const base = { name: "Persona ficticia", dni: "98.000.001", phone: "3410000000", email: "", locality: "", summary: "", availability: "available", detail: "", address: "", categories: [], interests: [] };
describe("atención presencial", () => {
  it("permite alta sin cuenta ni CV, normaliza DNI y exige nombre y contacto", () => {
    expect(assistedProfileSchema.parse(base).dni).toBe("98000001");
    expect(assistedProfileSchema.safeParse({ ...base, phone: "" }).success).toBe(false);
    expect(assistedProfileSchema.safeParse({ ...base, phone: "", email: "persona@example.invalid" }).success).toBe(true);
    expect(assistedProfileSchema.safeParse({ ...base, name: "" }).success).toBe(false);
  });
  it.each(["use_or_update_existing", "correct_and_create", "reject"])("exige motivo para %s", (decision) => {
    expect(duplicateResolutionSchema.safeParse({ reviewId: id, decision, reason: "Revisión presencial ficticia", confirmedFields: [] }).success).toBe(true);
    expect(duplicateResolutionSchema.safeParse({ reviewId: id, decision, reason: "", confirmedFields: [] }).success).toBe(false);
  });
  it("rechaza actualización implícita, decisiones ajenas y reclamo remoto", () => {
    expect(duplicateResolutionSchema.safeParse({ reviewId: id, decision: "merge", reason: "x" }).success).toBe(false);
    expect(claimSchema.safeParse({ candidateId: id, version: 1, accountId: id, dni: "98000001", verifiedInPerson: false }).success).toBe(false);
    expect(claimSchema.safeParse({ candidateId: id, version: 1, accountId: id, dni: "98000001", verifiedInPerson: true, reason: "Comprobación presencial ficticia" }).success).toBe(true);
  });
  it("perfil activo sin CV sigue excluido de derivación", () => {
    const eligible = { status: "active", available: true, currentConsent: true, fresh: true, accountActive: true, archived: false, validCv: false };
    expect(referralEligibility(eligible)).toBe("VALID_CV_REQUIRED");
    expect(referralEligibility({ ...eligible, validCv: true })).toBe(null);
    expect(referralEligibility({ ...eligible, currentConsent: false })).toBe("CONSENT_REQUIRED");
  });
  it("muestra formulario accesible y la comprobación presencial sin copia del DNI", () => {
    render(<AssistedProfileForm categories={[]} />);
    expect(screen.getByLabelText(/DNI/)).toHaveProperty("type", "password");
    expect(screen.getByLabelText("Teléfono")).toBeTruthy();
    expect(screen.getByText(/administrador responsable/i)).toBeTruthy();
    render(<ClaimForm candidateId={id} version={1} requests={[]} />);
    expect(screen.getByLabelText(/Comprobé presencialmente/)).toHaveProperty("required", true);
    expect(screen.getByText(/correo verificado/i)).toBeTruthy();
  });
});
