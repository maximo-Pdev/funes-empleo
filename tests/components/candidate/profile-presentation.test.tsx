import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AttachmentAction } from "@/components/ui/attachment";

it("conserva el slot oficial de AttachmentAction y sus controles de 44px", () => {
  render(<AttachmentAction aria-label="Acción del adjunto">PDF</AttachmentAction>);
  const action = screen.getByRole("button", { name: "Acción del adjunto" });
  expect(action.getAttribute("data-slot")).toBe("attachment-action");
  expect(action.classList.contains("min-h-11")).toBe(true);
  expect(action.classList.contains("min-w-11")).toBe(true);
});

it("conserva los className funcionales del Avatar Base sin ampliar cn", () => {
  const { container } = render(<Avatar className={() => "custom-avatar"}><AvatarFallback className={() => "custom-fallback"}>PF</AvatarFallback></Avatar>);
  expect(container.querySelector('[data-slot="avatar"]')?.classList.contains("custom-avatar")).toBe(true);
  expect(container.querySelector('[data-slot="avatar-fallback"]')?.classList.contains("custom-fallback")).toBe(true);
});

it("adapta Button al render oficial sin perder su contrato municipal", () => {
  const { rerender } = render(<Button render={<a download href="/api/cv/ficticio" />} nativeButton={false} role="link" variant="ghost" size="icon-xs" aria-label="Descargar">PDF</Button>);
  expect(screen.getByRole("link", { name: "Descargar" })).toHaveProperty("href", "http://localhost:3000/api/cv/ficticio");
  rerender(<Button type="submit" name="command" value="save" busy busyLabel="Guardando…">Guardar</Button>);
  const button = screen.getByRole("button", { name: "Guardando…" });
  expect(button).toHaveProperty("disabled", true);
  expect(button).toHaveProperty("type", "submit");
  expect(button).toHaveProperty("name", "command");
  expect(button.classList.contains("bg-primary")).toBe(true);
  expect(button.classList.contains("min-h-11")).toBe(true);
});

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
  cvReference: "CV-FICTICIA-0001",
  policy: { version: "demo-not-approved", policy_text: "Política ficticia íntegra para pruebas.", policy_hash: "0".repeat(64) },
};

describe("presentación de consentimiento y activación", () => {
  it("explica el catálogo ausente y los requisitos pendientes sin inventar categorías", () => {
    render(<CandidateProfilePanel {...props} categories={[]} selectedCategories={[]} />);
    const categories = screen.getByRole("group", { name: "Categorías laborales" });
    expect(categories.querySelector('[data-slot="empty"]')).not.toBeNull();
    expect(within(categories).getByText("No hay categorías laborales disponibles.")).toBeTruthy();
    expect(within(categories).queryAllByRole("checkbox")).toHaveLength(0);
    const activation = screen.getByRole("region", { name: "Activación del perfil" });
    expect(activation.querySelector('[data-slot="empty"]')).not.toBeNull();
    expect(within(activation).getByText("Seleccioná y guardá al menos una categoría laboral.")).toBeTruthy();
  });
  it("presenta el CV persistido con Attachment y un Empty cuando todavía no hay CV", () => {
    const { rerender } = render(<CandidateProfilePanel {...props} />);
    let cvRegion = screen.getByRole("region", { name: "CV PDF" });
    expect(cvRegion.querySelector('[data-slot="attachment"]')).not.toBeNull();
    expect(cvRegion.querySelector('[data-slot="attachment-title"]')?.textContent).toBe("cv-ficticio.pdf");
    expect(within(cvRegion).getByRole("link", { name: "Descargar mi CV" }).getAttribute("href")).toBe("/api/cv/CV-FICTICIA-0001");
    expect(within(cvRegion).queryByRole("button", { name: /eliminar/i })).toBeNull();
    rerender(<CandidateProfilePanel {...props} cv={null} />);
    cvRegion = screen.getByRole("region", { name: "CV PDF" });
    expect(cvRegion.querySelector('[data-slot="empty"]')).not.toBeNull();
    expect(within(cvRegion).getByText("Todavía no hay un CV vigente.")).toBeTruthy();
    expect(within(cvRegion).getByRole("button", { name: "Cargar o reemplazar CV" })).toBeTruthy();
  });
  it.each([
    ["active", "green", "Activo"],
    ["draft", "neutral", "Borrador"],
    ["needs_update", "amber", "Necesita actualización"],
    ["unavailable", "neutral", "No disponible"],
    ["consent_withdrawn", "red", "Consentimiento retirado"],
    ["archived", "neutral", "Archivado"],
    ["unknown", "neutral", "En revisión"],
  ])("muestra un indicador veraz para %s", (status, tone, label) => {
    const { container } = render(<CandidateProfilePanel {...props} profile={{ ...props.profile, status }} cv={null} />);
    const badge = container.querySelector("[data-profile-status]");
    expect(badge?.getAttribute("data-tone")).toBe(tone);
    expect(badge?.textContent).toBe(label);
    expect(badge?.classList.contains(`border-status-${tone}`)).toBe(true);
  });
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
    const photo = screen.getByRole("region", { name: "Foto de perfil" });
    expect(container.firstElementChild?.firstElementChild).toBe(photo);
    expect(within(photo).getByRole("button", { name: "Subir foto" })).toBeTruthy();
    expect(within(photo).getByRole("button", { name: "Eliminar foto" })).toHaveProperty("disabled", true);
    expect(photo.compareDocumentPosition(activation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const form = within(activation).getByRole("button", { name: "Activar perfil" }).closest("form")!;
    expect(form.querySelector('input[name="version"]')).toHaveProperty("value", "3");
    expect(screen.getAllByRole("button", { name: "Activar perfil" })).toHaveLength(1);
    expect(within(activation).queryByText("Perfil activo", { exact: true })).toBeNull();
  });

  it("muestra el estado activo arriba sin ofrecer activación, independientemente de aptitud", () => {
    const { container } = render(<CandidateProfilePanel {...props} profile={{ ...props.profile, status: "active" }} cv={null} />);
    const activation = screen.getByRole("region", { name: "Activación del perfil" });
    expect(within(activation).queryByText("Perfil activo", { exact: true })).toBeNull();
    expect(container.querySelector("[data-profile-status]")?.textContent).toBe("Activo");
    expect(screen.queryByRole("button", { name: "Activar perfil" })).toBeNull();
    expect(within(activation).queryByRole("form")).toBeNull();
  });

  it.each(["archived", "unknown"])("no ofrece activación para estado %s", status => {
    render(<CandidateProfilePanel {...props} profile={{ ...props.profile, status }} />);
    expect(screen.queryByRole("button", { name: "Activar perfil" })).toBeNull();
    expect(screen.queryByText("Activo", { exact: true })).toBeNull();
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

  it("resume el consentimiento, agrupa Más información y conserva la aceptación explícita sin apartado de política", () => {
    render(<CandidateProfilePanel {...props} />);
    const consent = screen.getByRole("heading", { name: "Consentimiento de prueba" }).closest("form")!;
    expect(within(consent).getByText(/autorizás a la Oficina de Empleo/).closest("details")).toBeNull();
    expect(within(consent).getByText(/solo puede ver tu perfil laboral, tus contactos vigentes y el CV/)).toBeTruthy();
    expect(within(consent).getByText(/No puede ver tu DNI, domicilio ni notas internas/)).toBeTruthy();
    const hiring = within(consent).getByText(/Si la Oficina confirma una contratación en/);
    expect(hiring.textContent).toMatch(/consentimiento vigente se retira automáticamente/);
    expect(hiring.textContent).toMatch(/todas las empresas/);
    expect(hiring.closest("details")).toBeNull();
    expect(within(consent).getByText(/otras participaciones ni sus resultados/)).toBeTruthy();
    expect(within(consent).getByText(/volver a aceptarlo expresamente/)).toBeTruthy();
    const more = within(consent).getByText("Más información", { exact: true }).closest("details")!;
    expect(more).toHaveProperty("open", false);
    expect(more.querySelectorAll("p")).toHaveLength(3);
    expect(within(more).getByText(/Una empresa solo puede ver/)).toBeTruthy();
    expect(within(more).getByText(/seguir viendo únicamente tu nombre/)).toBeTruthy();
    expect(within(more).getByText(/Corregir un resultado no restablece/)).toBeTruthy();
    expect(within(consent).queryByText(props.policy.policy_text, { exact: false })).toBeNull();
    expect(within(consent).queryByText("Ver política de consentimiento")).toBeNull();
    expect(within(consent).getByRole("checkbox")).toHaveProperty("required", true);
    expect(within(consent).queryByRole("combobox")).toBeNull();
  });
});
