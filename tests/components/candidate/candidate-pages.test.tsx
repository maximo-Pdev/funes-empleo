import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), workspace: vi.fn(), offers: vi.fn(), selected: vi.fn(), participations: vi.fn(), policy: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireActiveAccount: mocks.guard }));
vi.mock("@/features/candidates/profile-service", () => ({ getCandidateWorkspace: mocks.workspace }));
vi.mock("@/features/candidates/consent-service", () => ({ getDemoConsentPolicy: mocks.policy }));
vi.mock("@/features/openings/public-service", () => ({ listPublicOffers: mocks.offers, getPublicOffer: mocks.selected }));
vi.mock("@/features/participations/candidate-service", () => ({ listMyParticipations: mocks.participations }));
vi.mock("@/features/candidates/profile-actions", () => ({ saveProfileAction: vi.fn(), savePhoneAction: vi.fn(), activateProfileAction: vi.fn(), archiveProfileAction: vi.fn() }));
vi.mock("@/features/candidates/consent-actions", () => ({ changeConsentAction: vi.fn() }));
vi.mock("@/features/participations/candidate-actions", () => ({ applyToOfferAction: vi.fn(), withdrawParticipationAction: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import OffersPage from "@/app/(candidate)/candidato/ofertas/page";
import ProfilePage from "@/app/(candidate)/candidato/perfil/page";
import ParticipationsPage from "@/app/(candidate)/candidato/postulaciones/page";
import { AppError } from "@/lib/errors/public-error";

const offer = { id: "0a000000-0000-4000-8000-000000000001", title: "Auxiliar administrativo", company_name: "Empresa Ficticia", location: "Funes", closing_date: "2026-11-30", tasks: "Tareas ficticias", requirements: "Experiencia", vacancies: 1, modality: "Presencial", schedule: "Completo", contract_type: "Permanente", salary: null, benefits: null, categories: [] };
function workspace(status = "active") { return { bootstrap: "ready", profile: { id: offer.id, display_name: "Persona Ficticia", locality: "Funes", skills_experience_summary: "Experiencia ficticia de atención y administración", availability: "available", availability_detail: "", status, version: 1, refresh_due_at: "2027-04-07" }, privateData: { dni_display: "90000001", address: null }, contacts: [], categories: [{ category_id: offer.id }], allCategories: [{ id: offer.id, name: "Administración", code: "ADMIN" }], consent: { status: "accepted", policy_version: "demo", recorded_at: "2026-10-07" }, cv: { id: offer.id, original_name_safe: "cv-ficticio.pdf", byte_size: 500 }, account: { version: 1 } }; }
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue(undefined); mocks.workspace.mockResolvedValue(workspace()); mocks.offers.mockResolvedValue({ items: [offer], page: 1, pageSize: 10, total: 11 }); mocks.selected.mockResolvedValue(offer); mocks.participations.mockResolvedValue([]); mocks.policy.mockResolvedValue({ version: "demo-not-approved", policy_hash: "demo", policy_text: "Consentimiento ficticio de prueba." }); });
it("mantiene el bloqueo del perfil y evita duplicar una oferta seleccionada", async () => {
 mocks.workspace.mockResolvedValue(workspace("draft"));
 render(await OffersPage({ searchParams: Promise.resolve({ oferta: offer.id }) }));
 expect(mocks.guard).toHaveBeenCalledWith(["candidate"]);
 expect(screen.getByRole("button", { name: "Postularme" })).toHaveProperty("disabled", true);
 expect(screen.getAllByRole("heading", { name: /Auxiliar administrativo/ })).toHaveLength(1);
 expect(screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")).toBe("/candidato/ofertas?page=2");
});
it("no habilita otra postulación para una oferta ya registrada", async () => {
 mocks.participations.mockResolvedValue([{ opening_id: offer.id }]);
 render(await OffersPage({ searchParams: Promise.resolve({}) }));
 expect(screen.getByRole("button", { name: "Participación registrada" })).toHaveProperty("disabled", true);
});
it("conserva el aviso cuando la oferta seleccionada dejó de estar disponible", async () => {
 mocks.selected.mockRejectedValue(new AppError("NOT_FOUND"));
 render(await OffersPage({ searchParams: Promise.resolve({ oferta: offer.id }) }));
 expect(screen.getByText("La oferta elegida ya no está disponible para postularse.")).toBeTruthy();
});
it("solo permite retirar participaciones recibidas y exige confirmación", async () => {
 mocks.participations.mockResolvedValue([{ id: "recibida", opening_title: "Oferta recibida", display_status: "received", version: 2, created_at: "2026-10-07" }, { id: "final", opening_title: "Oferta final", display_status: "hired", version: 3, created_at: "2026-10-07" }]);
 render(await ParticipationsPage());
 expect(screen.getAllByRole("button", { name: "Retirar participación" })).toHaveLength(1);
 expect(screen.getByRole("checkbox")).toHaveProperty("required", true);
 expect(within(screen.getByText("Oferta final").closest("li")!).queryByRole("button")).toBeNull();
});
it("mantiene el aviso presencial y no muestra formularios para un perfil pendiente", async () => {
 mocks.workspace.mockResolvedValue({ bootstrap: "pending_in_person_claim", profile: null });
 render(await ProfilePage({ searchParams: Promise.resolve({}) }));
 expect(screen.getByRole("alert").textContent).toContain("atención presencial");
 expect(screen.queryByRole("button", { name: "Guardar correcciones" })).toBeNull();
});

import CandidateError from "@/app/(candidate)/candidato/error";
import { fireEvent } from "@testing-library/react";
it("enfoca el error y conserva la acción de reintentar", () => {
 const reset = vi.fn();
 render(<CandidateError error={new Error("ficticio")} reset={reset} />);
 expect(document.activeElement).toBe(screen.getByRole("heading", { name: "No pudimos cargar esta pantalla" }));
 fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
 expect(reset).toHaveBeenCalledOnce();
});
