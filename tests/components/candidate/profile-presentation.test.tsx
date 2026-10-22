import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/features/candidates/profile-actions", () => ({
  saveProfileAction: vi.fn(), savePhoneAction: vi.fn(), activateProfileAction: vi.fn(),
}));
vi.mock("@/features/candidates/consent-actions", () => ({ changeConsentAction: vi.fn() }));
import { CandidateProfilePanel } from "@/features/candidates/components/candidate-profile-panel";

const categoryId = "0a000000-0000-4000-8000-000000000001";
const props: ComponentProps<typeof CandidateProfilePanel> = {
  profile: { id: categoryId, display_name: "Persona Ficticia", locality: "Funes",
    skills_experience_summary: "Experiencia ficticia", availability: "available",
    availability_detail: null, status: "draft", version: 3, refresh_due_at: null },
  dni: "90000001", address: null, phone: null,
  categories: [{ id: categoryId, name: "Categoría ficticia", code: "FICT" }], selectedCategories: [categoryId],
  consent: { status: "accepted", policy_version: "demo-not-approved", recorded_at: "2026-10-22" },
  cv: { id: categoryId, original_name_safe: "cv-ficticio.pdf", byte_size: 608 },
  policy: { version: "demo-not-approved", policy_text: "Política ficticia íntegra para pruebas.", policy_hash: "0".repeat(64) },
};

describe("presentación de consentimiento y activación", () => {
  it("integra teléfono opcional en la tarjeta de datos sin formularios anidados y coloca CV antes del consentimiento", () => {
    const { container } = render(<CandidateProfilePanel {...props} phone="3415550100" />);
    const details = screen.getByRole("region", { name: "Datos laborales y personales" });
    const phone = within(details).getByRole("textbox", { name: "Teléfono (opcional)" });
    expect(phone).toHaveProperty("required", false);
    expect(phone).toHaveProperty("value", "3415550100");
    expect(within(details).getByRole("button", { name: "Guardar teléfono" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Contacto adicional" })).toBeNull();
    expect(container.querySelector("form form")).toBeNull();
    const cv = screen.getByRole("region", { name: "CV PDF" });
    const consent = screen.getByRole("heading", { name: "Consentimiento de prueba" }).closest("form")!;
    expect(cv.compareDocumentPosition(consent) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each(["draft", "needs_update", "unavailable", "consent_withdrawn"])("ofrece activación primero para %s elegible", status => {
    const { container } = render(<CandidateProfilePanel {...props} profile={{ ...props.profile, status }} />);
    const activation = screen.getByRole("region", { name: "Activación del perfil" });
    expect(container.firstElementChild?.firstElementChild).toBe(activation);
    const form = within(activation).getByRole("button", { name: "Activar perfil" }).closest("form")!;
    expect(form.querySelector('input[name="version"]')).toHaveProperty("value", "3");
    expect(screen.getAllByRole("button", { name: "Activar perfil" })).toHaveLength(1);
    expect(within(activation).queryByText("Perfil activo", { exact: true })).toBeNull();
  });

  it("muestra Perfil activo arriba sin ofrecer activación, independientemente de aptitud", () => {
    render(<CandidateProfilePanel {...props} profile={{ ...props.profile, status: "active" }} cv={null} />);
    const activation = screen.getByRole("region", { name: "Activación del perfil" });
    expect(within(activation).getByText("Perfil activo", { exact: true })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Activar perfil" })).toBeNull();
    expect(within(activation).queryByRole("form")).toBeNull();
  });

  it.each(["archived", "unknown"])("no ofrece activación para estado %s", status => {
    render(<CandidateProfilePanel {...props} profile={{ ...props.profile, status }} />);
    expect(screen.queryByRole("button", { name: "Activar perfil" })).toBeNull();
    expect(screen.queryByText("Perfil activo", { exact: true })).toBeNull();
  });

  it.each([
    { label: "localidad", change: { profile: { ...props.profile, locality: "  " } }, missing: "Completá y guardá tu localidad laboral." },
    { label: "resumen", change: { profile: { ...props.profile, skills_experience_summary: null } }, missing: "Completá y guardá tus habilidades y experiencia." },
    { label: "categoría", change: { selectedCategories: [] }, missing: "Seleccioná y guardá al menos una categoría laboral." },
    { label: "disponibilidad", change: { profile: { ...props.profile, availability: "unavailable" } }, missing: "Elegí Disponible y guardá tus datos laborales." },
    { label: "consentimiento pendiente", change: { consent: null }, missing: "Aceptá y guardá el consentimiento para el tratamiento laboral de tus datos." },
    { label: "consentimiento retirado", change: { consent: { ...props.consent!, status: "withdrawn" } }, missing: "Aceptá y guardá el consentimiento para el tratamiento laboral de tus datos." },
    { label: "CV", change: { cv: null }, missing: "Cargá un CV PDF válido." },
  ])("oculta el botón y explica el requisito de $label", ({ change, missing }) => {
    render(<CandidateProfilePanel {...props} {...change} />);
    const activation = screen.getByRole("region", { name: "Activación del perfil" });
    expect(screen.queryByRole("button", { name: "Activar perfil" })).toBeNull();
    expect(within(activation).getByText(missing)).toBeTruthy();
  });

  it("aclara el consentimiento global al contratar y conserva la política y aceptación explícita", () => {
    render(<CandidateProfilePanel {...props} />);
    const consent = screen.getByRole("heading", { name: "Consentimiento de prueba" }).closest("form")!;
    expect(within(consent).getByText(/autorizás a la Oficina de Empleo/)).toBeTruthy();
    expect(within(consent).getByText(/solo puede ver tu perfil laboral, tus contactos vigentes y el CV/)).toBeTruthy();
    expect(within(consent).getByText(/No puede ver tu DNI, domicilio ni notas internas/)).toBeTruthy();
    expect(within(consent).getByText(/contratación, incluso tardía/).textContent).toMatch(/consentimiento global vigente se retira automáticamente/);
    expect(within(consent).getByText(/contratación, incluso tardía/).textContent).toMatch(/todas las empresas/);
    expect(within(consent).getByText(/otras participaciones ni sus resultados/)).toBeTruthy();
    expect(within(consent).getByText(/volver a aceptarlo expresamente/)).toBeTruthy();
    expect(within(consent).getByText(/retirarlo manualmente/)).toBeTruthy();
    const policy = within(consent).getByText(props.policy.policy_text, { exact: false }).closest("details")!;
    expect(policy).toHaveProperty("open", false);
    expect(within(policy).getByText(/no es texto municipal aprobado/)).toBeTruthy();
    expect(within(policy).getByText("Ver política de consentimiento")).toBeTruthy();
    expect(within(consent).getByRole("checkbox")).toHaveProperty("required", true);
    expect(within(consent).getByRole("combobox")).toHaveProperty("value", "withdrawn");
  });
});
