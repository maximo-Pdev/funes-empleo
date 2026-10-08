import { beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), workspace: vi.fn(), offers: vi.fn(), categories: vi.fn(), references: vi.fn(), referral: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireActiveAccount: mocks.guard }));
vi.mock("@/features/companies/service", () => ({ getCompanyWorkspace: mocks.workspace }));
vi.mock("@/features/openings/company-service", () => ({ listCompanyOffers: mocks.offers, listCompanyCategories: mocks.categories }));
vi.mock("@/features/referrals/service", () => ({ listCompanyReferralReferences: mocks.references, getCompanyReferral: mocks.referral }));
vi.mock("@/features/companies/company-actions", () => ({ saveCompanyProfileAction: vi.fn(), archiveCompanyAction: vi.fn() }));
vi.mock("@/features/openings/company-actions", () => ({ saveCompanyOpeningAction: vi.fn(), submitCompanyOpeningAction: vi.fn() }));
vi.mock("@/features/referrals/feedback-actions", () => ({ submitFeedbackAction: vi.fn(), submitInterviewAction: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }), notFound: () => { throw new Error("NOT_FOUND"); } }));
import Dashboard from "@/app/(company)/empresa/page";
import Profile from "@/app/(company)/empresa/perfil/page";
import Offers from "@/app/(company)/empresa/ofertas/page";
import NewOpening from "@/app/(company)/empresa/ofertas/nueva/page";
import Opening from "@/app/(company)/empresa/ofertas/[openingId]/page";
import Referrals from "@/app/(company)/company/openings/[openingId]/referrals/page";
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
it("conserva el CUIT oculto y la confirmación obligatoria para archivar", async () => {
 render(await Profile()); expect(screen.getByLabelText("CUIT")).toHaveProperty("type", "password");
 expect(screen.getByRole("checkbox")).toHaveProperty("required", true);
});
it("no permite enviar una oferta nueva antes de guardarla", async () => {
 render(await NewOpening()); expect(screen.getByRole("button", { name: "Guardar borrador" })).toBeTruthy();
 expect(screen.queryByRole("button", { name: "Enviar a revisión municipal" })).toBeNull();
});
it.each(["draft", "changes_requested", "published", "closed"])("respeta la edición y revisión municipal en estado %s", async status => {
 mocks.offers.mockResolvedValue({ items: [{ ...offer, status }] }); render(await Opening({ params: Promise.resolve({ openingId: id }) }));
 const editable = status === "draft" || status === "changes_requested";
 expect(Boolean(screen.queryByRole("button", { name: "Guardar borrador" }))).toBe(editable);
 expect(Boolean(screen.queryByRole("button", { name: "Enviar a revisión municipal" }))).toBe(editable);
 expect(screen.getByRole("heading", { name: "Historial de moderación" })).toBeTruthy();
 expect(screen.getByRole("link", { name: "Ver derivaciones de esta oferta" }).getAttribute("href")).toBe(`/company/openings/${id}/referrals`);
});
it("valida la página solicitada y conserva el mensaje municipal y la paginación", async () => {
 render(await Offers({ searchParams: Promise.resolve({ page: "invalida" }) })); expect(mocks.offers).toHaveBeenCalledWith(1);
 expect(screen.getByText("Detallar el horario de la búsqueda.")).toBeTruthy(); expect(screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")).toBe("/empresa/ofertas?page=2");
});
it("permite informar un resultado tras revocar el acceso sin mostrar datos ni CV", async () => {
 mocks.referral.mockResolvedValue({ ...referral, candidate: undefined }); render(await Referrals({ params: Promise.resolve({ openingId: id }), searchParams: Promise.resolve({ referral: id }) }));
 expect(mocks.referral).toHaveBeenCalledWith(id, id); expect(screen.getByRole("button", { name: "Enviar informe" })).toBeTruthy();
 expect(screen.queryByRole("link", { name: /Descargar CV/ })).toBeNull(); expect(screen.queryByRole("button", { name: "Registrar entrevista" })).toBeNull();
 expect(screen.queryByText("Persona Ficticia")).toBeNull(); expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});
it("conserva el límite de oferta inexistente", async () => {
 mocks.offers.mockResolvedValue({ items: [] }); await expect(Opening({ params: Promise.resolve({ openingId: id }) })).rejects.toThrow("NOT_FOUND");
});
