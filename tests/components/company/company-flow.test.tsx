import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { companyRegistrationSchema, companyProfileSchema } from "@/validation/company";
import { openingDraftSchema } from "@/validation/opening";

vi.mock("@/features/companies/company-actions", () => ({
  registerCompanyAction: vi.fn(), saveCompanyProfileAction: vi.fn(),
}));
vi.mock("@/features/companies/admin-actions", () => ({ adminCompanyAction: vi.fn() }));
vi.mock("@/features/openings/company-actions", () => ({
  saveCompanyOpeningAction: vi.fn(), submitCompanyOpeningAction: vi.fn(), cancelCompanyOpeningAction: vi.fn(),
}));
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";
import { CompanyProfileForm } from "@/features/companies/components/company-profile-form";
import { CompanyOpeningForm } from "@/features/openings/components/company/company-opening-form";
import { AdminCompanyDecision } from "@/features/companies/components/admin-company-decision";

const categoryA = "0a000000-0000-4000-8000-000000000001";
const categoryB = "0a000000-0000-4000-8000-000000000002";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

describe("autogestión de empresa", () => {
  it("traduce estados y códigos legados sin reescribir los datos enviados", () => {
    const { container } = render(<CompanyOpeningForm categories={[]} opening={{ id: categoryA, title: "Oferta ficticia",
      tasks: "Tareas", requirements: "Requisitos", vacancies: 1, location: "Funes", modality: "onsite",
      schedule: "Jornada completa", contract_type: "fixed_term", closingDate: "2027-10-01", salary: null,
      benefits: null, status: "draft", version: 1, createdAt: "2026-10-22", categories: [], history: [] }} />);
    expect(screen.getAllByRole("status").some(status => status.textContent?.includes("Borrador"))).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Editar oferta" }));
    expect(screen.getByLabelText("Modalidad")).toHaveProperty("value", "Presencial");
    expect(screen.getByLabelText("Tipo de contratación")).toHaveProperty("value", "Plazo fijo");
    const form = container.querySelector("form")!;
    expect(new FormData(form).get("modality")).toBe("onsite");
    expect(new FormData(form).get("contractType")).toBe("fixed_term");
    fireEvent.change(screen.getByLabelText("Modalidad"), { target: { value: "Remoto a convenir" } });
    expect(new FormData(form).get("modality")).toBe("Remoto a convenir");
    expect(new FormData(form).get("contractType")).toBe("fixed_term");
  });

  it("exige identificación, responsable, contacto, actividad y localidad sin pedir documentos", () => {
    const valid = { legalName: "Empresa ficticia", cuit: "30-99999999-7", responsibleName: "Responsable ficticio",
      email: "empresa@example.invalid", phone: "", activity: "Servicios", locality: "Funes" };
    expect(companyRegistrationSchema.safeParse({ ...valid, password: "Fictitious-123", confirmation: "Fictitious-123" }).success).toBe(true);
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

  it("muestra estado y guardado sin autoarchivo", () => {
    render(<CompanyProfileForm profile={{ id: categoryA, legalName: "Empresa ficticia", cuit: "30999999997",
      responsibleName: "Responsable ficticio", email: "empresa@example.invalid", phone: null,
      activity: "Servicios", locality: "Funes", status: "incomplete", version: 2 }} />);
    expect(screen.getByText(/incompleto/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Guardar perfil" })).toBeTruthy();
    const cuit = screen.getByLabelText("CUIT") as HTMLInputElement;
    const form = cuit.form!;
    const submit = vi.fn((event: Event) => event.preventDefault());
    form.addEventListener("submit", submit);
    expect(cuit).toHaveProperty("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Mostrar CUIT" }));
    expect(cuit).toHaveProperty("type", "text");
    expect(cuit.value).toBe("30999999997");
    fireEvent.change(cuit, { target: { value: "30-99999999-7" } });
    fireEvent.click(screen.getByRole("button", { name: "Ocultar CUIT" }));
    expect(cuit).toHaveProperty("type", "password");
    expect(new FormData(form).get("cuit")).toBe("30-99999999-7");
    expect(submit).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /archivar|eliminar/i })).toBeNull();
    expect(screen.queryByLabelText(/Confirmo el archivo/i)).toBeNull();
  });

  it("expone solo mensajes públicos de moderación y explica el cierre por fecha", () => {
    render(<CompanyOpeningForm categories={[]} opening={{ id: categoryA, title: "Oferta ficticia", tasks: "Tareas",
      requirements: "Requisitos", vacancies: 1, location: "Funes", modality: "Presencial",
      schedule: "Jornada completa", contract_type: "Plazo fijo", closingDate: "2026-09-20",
      salary: null, benefits: null, status: "closed", version: 3, createdAt: "2026-09-01T00:00:00Z",
      categories: [], history: [{ decision: "changes_requested", previousStatus: "pending_review",
        newStatus: "changes_requested", message: "Aclarar horario", at: "2026-09-02T00:00:00Z" }] }} />);
    expect(screen.getByText(/ya no recibe postulaciones/i)).toBeTruthy();
    expect(screen.getByText(/Aclarar horario/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Enviar a revisión municipal" })).toBeNull();
  });

  it("exige confirmación y motivo para suspender, archivar o restaurar desde administración", () => {
    render(<AdminCompanyDecision accountId={categoryA} version={1} command="suspend" />);
    render(<AdminCompanyDecision accountId={categoryB} version={2} command="archive" />);
    render(<AdminCompanyDecision accountId={categoryA} version={3} command="restore" />);
    expect(screen.getAllByLabelText(/Motivo interno/)).toHaveLength(3);
    expect(screen.getAllByLabelText(/Confirmo esta decisión/)).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Suspender empresa" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Archivar empresa" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Restaurar empresa" })).toBeTruthy();
  });
});
