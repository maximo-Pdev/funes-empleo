import { fixtureReference } from "../../fixtures/record-references";
import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), workspace: vi.fn(), offers: vi.fn(), categories: vi.fn(), references: vi.fn(), referral: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireActiveAccount: mocks.guard }));
vi.mock("@/features/companies/service", () => ({ getCompanyWorkspace: mocks.workspace }));
vi.mock("@/features/openings/company-service", () => ({ listCompanyOffers: mocks.offers, listCompanyCategories: mocks.categories }));
vi.mock("@/features/referrals/service", () => ({ listCompanyReferralReferences: mocks.references, getCompanyReferral: mocks.referral }));
vi.mock("@/features/companies/company-actions", () => ({ saveCompanyProfileAction: vi.fn() }));
vi.mock("@/features/openings/company-actions", () => ({ saveCompanyOpeningAction: vi.fn(), submitCompanyOpeningAction: vi.fn(), cancelCompanyOpeningAction: vi.fn() }));
vi.mock("@/features/referrals/feedback-actions", () => ({ submitFeedbackAction: vi.fn(), submitInterviewAction: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }), redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); }, notFound: () => { throw new Error("NOT_FOUND"); } }));
import Dashboard from "@/app/(company)/empresa/page";
import Profile from "@/app/(company)/empresa/perfil/page";
import Offers from "@/app/(company)/empresa/ofertas/page";
import NewOpening from "@/app/(company)/empresa/ofertas/nueva/page";
import Opening from "@/app/(company)/empresa/ofertas/[openingId]/page";
import Referrals from "@/app/(company)/company/openings/[openingId]/referrals/page";
import { CompanyOpeningReferrals } from "@/features/referrals/components/company-opening-referrals";
const id = "0a000000-0000-4000-8000-000000000001";
const offer = { id, title: "Auxiliar administrativo", tasks: "Atención y administración ficticias", requirements: "Experiencia administrativa", vacancies: 1, location: "Funes", modality: "Presencial", schedule: "Jornada completa", contract_type: "Permanente", closingDate: "2026-11-30", salary: null, benefits: null, status: "draft", version: 1, createdAt: "2026-10-07", categories: [{ id, name: "Administración" }], history: [{ decision: "request_changes", previousStatus: "submitted", newStatus: "changes_requested", message: "Detallar el horario de la búsqueda.", at: "2026-10-07T12:00:00Z" }] };
const workspace = { profile: { id, legalName: "Empresa Ficticia", cuit: "30712345678", responsibleName: "Persona Ficticia", email: "empresa@example.invalid", phone: "", activity: "Servicios administrativos ficticios", locality: "Funes", status: "active", version: 1 }, account: { version: 1 }, bootstrap: "ready" };
const referral = { referralId: id, openingId: id, openingTitle: offer.title, referredAt: "2026-10-07T12:00:00Z", participationVersion: 1, candidate: { displayName: "Persona Ficticia", locality: "Funes", skillsExperienceSummary: "Experiencia ficticia en administración", availability: "Jornada completa", categories: [{ name: "Administración", kind: "occupation" }], contacts: [], cvDocumentId: id } };
beforeEach(() => {
 vi.clearAllMocks(); mocks.guard.mockResolvedValue(undefined); mocks.workspace.mockResolvedValue(workspace);
 mocks.offers.mockResolvedValue({ items: [offer], page: 1, pageSize: 10, total: 11 }); mocks.categories.mockResolvedValue(offer.categories);
 mocks.references.mockResolvedValue([{ referral_id: id, opening_title: offer.title, referred_at: referral.referredAt }]); mocks.referral.mockResolvedValue(referral);
});
it("mantiene el bloqueo del panel sin consultar ofertas cuando falta el perfil", async () => {
 mocks.workspace.mockResolvedValue({ profile: null }); render(await Dashboard());
 expect(mocks.guard).toHaveBeenCalledWith(["company"]); expect(mocks.offers).not.toHaveBeenCalled(); expect(screen.getByRole("alert")).toBeTruthy();
});
it("conserva el CUIT oculto sin opciones de autoarchivo", async () => {
 render(await Profile()); expect(screen.getByLabelText("CUIT")).toHaveProperty("type", "password");
 expect(screen.queryByRole("button", { name: /archivar|eliminar/i })).toBeNull();
 expect(screen.queryByRole("checkbox")).toBeNull();
});
it("no permite enviar una oferta nueva antes de guardarla", async () => {
 render(await NewOpening()); expect(screen.getByRole("button", { name: "Guardar borrador" })).toBeTruthy();
 expect(screen.queryByRole("button", { name: "Enviar a revisión municipal" })).toBeNull();
});
it.each(["draft", "changes_requested", "published", "closed"])("respeta la edición y revisión municipal en estado %s", async status => {
 mocks.offers.mockResolvedValue({ items: [{ ...offer, status }] }); render(await Opening({ params: Promise.resolve({ openingId: id }) }));
 const editable = status === "draft" || status === "changes_requested";
 expect(screen.queryByLabelText("Título")).toBeNull();
 expect(screen.getByRole("region", { name: "Información de la oferta" })).toBeTruthy();
 expect(Boolean(screen.queryByRole("button", { name: "Editar oferta" }))).toBe(editable || status === "published");
 expect(Boolean(screen.queryByRole("button", { name: "Enviar a revisión municipal" }))).toBe(editable);
 if (editable || status === "published") fireEvent.click(screen.getByRole("button", { name: "Editar oferta" }));
 expect(Boolean(screen.queryByRole("button", { name: "Guardar borrador" }))).toBe(editable);
 expect(screen.getByRole("heading", { name: "Historial de moderación" })).toBeTruthy();
 expect(Boolean(screen.queryByRole("button", { name: "Guardar cambios y enviar a revisión" }))).toBe(status === "published");
 expect(screen.getByRole("heading", { name: "Candidatos derivados" })).toBeTruthy();
 expect(screen.queryByRole("link", { name: "Ver derivaciones de esta oferta" })).toBeNull();
});
it("valida la página solicitada y conserva el mensaje municipal y la paginación", async () => {
 render(await Offers({ searchParams: Promise.resolve({ page: "invalida" }) })); expect(mocks.offers).toHaveBeenCalledWith(1);
 expect(screen.getByText("Detallar el horario de la búsqueda.")).toBeTruthy(); expect(screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")).toBe("/empresa/ofertas?page=2");
});
it("publicada exige completar los datos; cancelación pide motivo y confirmación", async () => {
 mocks.offers.mockResolvedValue({ items: [{ ...offer, status: "published" }] });
 render(await Opening({ params: Promise.resolve({ openingId: id }) }));
 fireEvent.click(screen.getByRole("button", { name: "Editar oferta" }));
 expect(screen.getByLabelText("Título")).toHaveProperty("required", true);
 expect(screen.getByLabelText("Tareas")).toHaveProperty("required", true);
 expect(screen.getByLabelText("Motivo de la cancelación")).toHaveProperty("required", true);
 expect(screen.getByLabelText(/Confirmo que quiero cancelar/)).toHaveProperty("required", true);
 expect(screen.getByRole("button", { name: "Eliminar oferta" })).toBeTruthy();
});
it("no permite editar ni cancelar una oferta final", async () => {
 mocks.offers.mockResolvedValue({ items: [{ ...offer, status: "cancelled" }] });
 render(await Opening({ params: Promise.resolve({ openingId: id }) }));
 expect(screen.queryByLabelText("Título")).toBeNull();
 expect(screen.queryByRole("button", { name: "Eliminar oferta" })).toBeNull();
 expect(screen.getAllByRole("status").some(node => node.textContent?.includes("Cancelada"))).toBe(true);
});
it("una empresa restaurada consulta el borrador sin recuperar acceso a candidatos", async () => {
 mocks.workspace.mockResolvedValue({ ...workspace, profile: { ...workspace.profile, status: "incomplete" } });
 render(await Opening({ params: Promise.resolve({ openingId: id }) }));
 expect(screen.getByRole("button", { name: "Editar oferta" })).toBeTruthy();
 expect(screen.getByText(/Completá y guardá el perfil de tu empresa/)).toBeTruthy();
 expect(mocks.references).not.toHaveBeenCalled(); expect(mocks.referral).not.toHaveBeenCalled();
});
it("abre edición con foco y permite volver al detalle sin guardar cambios", async () => {
 render(await Opening({ params: Promise.resolve({ openingId: id }) }));
 fireEvent.click(screen.getByRole("button", { name: "Editar oferta" }));
 expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Editar oferta" }));
 expect(screen.queryByRole("button", { name: "Enviar a revisión municipal" })).toBeNull();
 fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Cambio sin guardar" } });
 fireEvent.click(screen.getByRole("button", { name: "Cancelar edición" }));
 expect(screen.queryByLabelText("Título")).toBeNull();
 expect(screen.queryByText("Cambio sin guardar")).toBeNull();
 expect(document.activeElement).toBe(screen.getByRole("button", { name: "Editar oferta" }));
 fireEvent.click(screen.getByRole("button", { name: "Editar oferta" }));
 expect(screen.getByLabelText("Título")).toHaveProperty("value", offer.title);
});
it("una versión guardada vuelve al detalle actualizado y permite otra edición", async () => {
 const view = render(await Opening({ params: Promise.resolve({ openingId: id }) }));
 fireEvent.click(screen.getByRole("button", { name: "Editar oferta" }));
 mocks.offers.mockResolvedValue({ items: [{ ...offer, version: 2, tasks: "Tareas actualizadas ficticias" }] });
 view.rerender(await Opening({ params: Promise.resolve({ openingId: id }) }));
 expect(screen.queryByLabelText("Título")).toBeNull();
 expect(screen.getByText("Tareas actualizadas ficticias")).toBeTruthy();
 expect(screen.getByRole("button", { name: "Editar oferta" })).toBeTruthy();
});
it("permite informar un resultado tras revocar el acceso sin mostrar datos ni CV", async () => {
 mocks.referral.mockResolvedValue({ ...referral, candidate: undefined }); render(await Opening({ params: Promise.resolve({ openingId: id }), searchParams: Promise.resolve({ referral: id }) }));
 expect(mocks.referral).toHaveBeenCalledWith(id, id); expect(screen.getByRole("button", { name: "Enviar informe" })).toBeTruthy();
 expect(screen.queryByRole("link", { name: /Descargar CV/ })).toBeNull(); expect(screen.queryByRole("button", { name: "Registrar entrevista" })).toBeNull();
 expect(screen.queryByText("Persona Ficticia")).toBeNull(); expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});
it("la contratación propia conserva solo nombre y no ofrece CV/contactos/entrevista/informe", async () => {
 mocks.referral.mockResolvedValue({ ...referral, candidate: undefined, hiredCandidate: { displayName: "Persona contratada ficticia", outcome: "hired" } });
 render(await CompanyOpeningReferrals({ openingId: id }));
 expect(screen.getByText("Persona contratada ficticia · Contratado")).toBeTruthy();
 expect(screen.queryByRole("link", { name: /Descargar CV/ })).toBeNull();
 expect(screen.queryByRole("heading", { name: "Contactos vigentes" })).toBeNull();
 expect(screen.queryByRole("button", { name: "Enviar informe" })).toBeNull();
 expect(screen.queryByRole("button", { name: "Registrar entrevista" })).toBeNull();
});
it("ruta antigua de derivaciones dirige al detalle empresarial canónico", async () => {
 await expect(Referrals({ params: Promise.resolve({ openingId: id }), searchParams: Promise.resolve({}) })).rejects.toThrow(`REDIRECT:/empresa/ofertas/${fixtureReference("opening", id)}#derivaciones`);
});
vi.mock("@/lib/records/reference-url", async () => ({ referenceUrl: async (href: string) => (await import("../../fixtures/record-references")).fixtureHref(href) }));
it("conserva el límite de oferta inexistente", async () => {
 mocks.offers.mockResolvedValue({ items: [] }); await expect(Opening({ params: Promise.resolve({ openingId: id }) })).rejects.toThrow("NOT_FOUND");
});

vi.mock("@/lib/records/references", async () => (await import("../../fixtures/record-references")).referenceMocks);
vi.mock("@/lib/records/page-references", async () => (await import("../../fixtures/record-references")).pageReferenceMocks);
vi.mock("@/components/ui/record-link", async () => (await import("../../fixtures/record-references")).recordLinkMocks);
