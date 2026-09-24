import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { companyRegistrationSchema, companyProfileSchema } from "@/validation/company";
import { openingDraftSchema } from "@/validation/opening";

vi.mock("@/features/companies/company-actions", () => ({
  registerCompanyAction: vi.fn(), saveCompanyProfileAction: vi.fn(), archiveCompanyAction: vi.fn(),
}));
vi.mock("@/features/openings/company-actions", () => ({
  saveCompanyOpeningAction: vi.fn(), submitCompanyOpeningAction: vi.fn(),
}));
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";
import { CompanyProfileForm } from "@/features/companies/components/company-profile-form";
import { CompanyOpeningForm } from "@/features/openings/components/company/company-opening-form";

const categoryA = "0a000000-0000-4000-8000-000000000001";
const categoryB = "0a000000-0000-4000-8000-000000000002";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

describe("autogestión de empresa", () => {
  it("exige identificación, responsable, contacto, actividad y localidad sin pedir documentos", () => {
    const valid = { legalName: "Empresa ficticia", cuit: "30-99999999-7", responsibleName: "Responsable ficticio",
      email: "empresa@example.invalid", phone: "", activity: "Servicios", locality: "Funes" };
    expect(companyRegistrationSchema.safeParse({ ...valid, password: "Fictitious-123" }).success).toBe(true);
    expect(companyProfileSchema.safeParse({ ...valid, version: 1, email: "", phone: "" }).success).toBe(false);
    render(<CompanyRegistrationForm />);
    expect(screen.getByLabelText("CUIT")).toBeTruthy();
    expect(screen.getByLabelText("Persona responsable")).toBeTruthy();
    expect(screen.queryByLabelText(/documentaci/i)).toBeNull();
  });

  it("permite borrador incompleto pero exige datos laborales y categorías para enviar", () => {
    const draft = { version: 1, title: "Puesto ficticio", tasks: "Tareas", requirements: "Requisitos",
      vacancies: 1, location: "Funes", modality: "Presencial", schedule: "Jornada completa",
      contractType: "Plazo fijo", closingDate: "2027-10-01", salary: "", benefits: "",
      categories: [categoryA, categoryB] };
    expect(openingDraftSchema.safeParse(draft).success).toBe(true);
    expect(openingDraftSchema.safeParse({ ...draft, vacancies: 0 }).success).toBe(false);
    expect(openingDraftSchema.safeParse({ ...draft, categories: [categoryA, categoryA] }).success).toBe(false);
    render(<CompanyOpeningForm opening={null} categories={[{ id: categoryA, name: "Categoría A" }]} />);
    expect(screen.getByRole("button", { name: "Guardar borrador" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Publicar directamente/i })).toBeNull();
  });

  it("muestra estado, archivo explícito y restauración segura", () => {
    render(<CompanyProfileForm profile={{ id: categoryA, legalName: "Empresa ficticia", cuit: "30999999997",
      responsibleName: "Responsable ficticio", email: "empresa@example.invalid", phone: null,
      activity: "Servicios", locality: "Funes", status: "incomplete", version: 2 }} accountVersion={3} />);
    expect(screen.getByText(/incompleto/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Archivar empresa" })).toBeTruthy();
    expect(screen.getByLabelText(/Confirmo el archivo/i)).toHaveProperty("required", true);
  });
});
