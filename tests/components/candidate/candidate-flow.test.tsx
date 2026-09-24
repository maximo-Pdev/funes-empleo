import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { candidateRegistrationSchema } from "@/validation/candidate-registration";
import { candidateProfileSchema } from "@/validation/candidate-profile";
import { validatePdf } from "@/lib/files/pdf-validation";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/candidates/profile-actions", () => ({
  saveProfileAction: vi.fn(), savePhoneAction: vi.fn(), activateProfileAction: vi.fn(), archiveProfileAction: vi.fn(),
}));
vi.mock("@/features/candidates/consent-actions", () => ({ changeConsentAction: vi.fn() }));
vi.mock("@/features/participations/candidate-actions", () => ({
  applyToOfferAction: vi.fn(), withdrawParticipationAction: vi.fn(),
}));
import { CandidateRegistrationForm } from "@/features/candidates/components/candidate-registration-form";
import { CandidateProfilePanel } from "@/features/candidates/components/candidate-profile-panel";
import { CandidateApplyForm, CandidateWithdrawForm } from "@/features/participations/components/candidate-status";
import { candidateStatusLabels } from "@/features/participations/candidate-status-labels";

const categoryA = "0a000000-0000-4000-8000-000000000001";
const categoryB = "0a000000-0000-4000-8000-000000000002";

describe("autogestión candidata", () => {
  it("normaliza el DNI y exige los campos mínimos del autorregistro", () => {
    expect(candidateRegistrationSchema.parse({ name: " Persona Ficticia ", dni: "90.000.001",
      email: "test@example.invalid", password: "Fictitious-123" }).dni).toBe("90000001");
    expect(candidateRegistrationSchema.safeParse({ name: "A", dni: "abc", email: "invalid", password: "1" }).success).toBe(false);
    render(<CandidateRegistrationForm />);
    expect(screen.getByLabelText("Nombre y apellido")).toBeTruthy();
    expect(screen.getByLabelText("DNI")).toBeTruthy();
    expect(screen.getByLabelText("Correo electrónico")).toBeTruthy();
    expect(screen.getByText(/vinculación presencial/i)).toBeTruthy();
  });

  it("acepta varias categorías y rechaza IDs duplicados antes de llegar a la base", () => {
    const base = { version: 1, name: "Persona Ficticia", dni: "90000001", locality: "Funes",
      summary: "Experiencia ficticia", availability: "available", detail: "", address: "" };
    expect(candidateProfileSchema.safeParse({ ...base, categories: [categoryA, categoryB] }).success).toBe(true);
    expect(candidateProfileSchema.safeParse({ ...base, categories: [categoryA, categoryA] }).success).toBe(false);
  });

  it("muestra DNI enmascarado, consentimiento de prueba y archivo explícito", () => {
    render(<CandidateProfilePanel profile={{ id: categoryA, display_name: "Persona Ficticia", locality: "Funes",
      skills_experience_summary: "Experiencia ficticia", availability: "available", availability_detail: null,
      status: "draft", version: 3, refresh_due_at: null }} dni="90000001" address={null} phone={null}
      categories={[{ id: categoryA, name: "Categoría A", code: "A" }, { id: categoryB, name: "Categoría B", code: "B" }]}
      selectedCategories={[categoryA, categoryB]} consent={null} cv={null} accountVersion={1}
      policy={{ version: "demo-not-approved", policy_text: "Texto ficticio de prueba", policy_hash: "0".repeat(64) }} />);
    expect(screen.getByLabelText(/DNI/)).toHaveProperty("type", "password");
    expect(screen.getByLabelText("Categoría A")).toHaveProperty("checked", true);
    expect(screen.getByLabelText("Categoría B")).toHaveProperty("checked", true);
    expect(screen.getByText(/no es texto municipal aprobado/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Activar perfil" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Archivar ahora" })).toBeTruthy();
    expect(screen.getByLabelText(/Confirmo que quiero archivar/)).toHaveProperty("required", true);
  });

  it("muestra solo recepción o resultado final y permite retirar una nominación abierta", () => {
    expect(Object.keys(candidateStatusLabels)).toEqual([
      "received", "hired", "not_selected", "withdrawn", "cancelled", "no_company_response",
    ]);
    expect(candidateStatusLabels).not.toHaveProperty("preselected");
    render(<CandidateWithdrawForm participationId={categoryA} version={2} />);
    expect(screen.getByRole("button", { name: "Retirar participación" })).toBeTruthy();
    expect(screen.getByLabelText(/Confirmo que quiero retirar/)).toHaveProperty("required", true);
    render(<CandidateApplyForm openingId={categoryB} candidateVersion={2} disabled={true} />);
    expect(screen.getByRole("button", { name: "Postularme" })).toHaveProperty("disabled", true);
  });

  it("rechaza un PDF dañado o con acción ejecutable sin sustituir un CV vigente", () => {
    const fixture = new Uint8Array(readFileSync(join(process.cwd(), "tests/fixtures/cv-fictitious.pdf")));
    const valid = validatePdf("cv-ficticio.pdf", "application/pdf", fixture);
    expect(valid?.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(validatePdf("cv.png", "application/pdf", fixture)).toBeNull();
    expect(validatePdf("cv.pdf", "image/png", fixture)).toBeNull();
    expect(validatePdf("cv.pdf", "application/pdf", fixture.subarray(0, 100))).toBeNull();
    const injected = Buffer.from(fixture);
    const text = injected.toString("latin1").replace("/Root", "/JavaScript /Root");
    expect(validatePdf("cv.pdf", "application/pdf", Buffer.from(text, "latin1"))).toBeNull();
  });
});
