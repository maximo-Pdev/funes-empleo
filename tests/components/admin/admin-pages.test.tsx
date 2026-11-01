import { fixtureReference } from "../../fixtures/record-references";
import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import accountStyles from "@/app/(auth)/account/account.module.css";
import homeStyles from "@/app/(public)/home.module.css";
import formStyles from "@/components/forms/form.module.css";
import adminStyles from "@/app/(admin)/_components/admin-workspace.module.css";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), search: vi.fn(), assistedSearch: vi.fn(), categories: vi.fn(), candidate: vi.fn(), nominations: vi.fn(), assisted: vi.fn(), openings: vi.fn(), opening: vi.fn(), participations: vi.fn(), participation: vi.fn(), contacts: vi.fn(), imports: vi.fn(), preview: vi.fn(), metrics: vi.fn(), metricCategories: vi.fn(), from: vi.fn(), range: vi.fn(), company: vi.fn(), account: vi.fn(), companyOffers: vi.fn(), moderate: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireActiveAccount: mocks.guard }));
vi.mock("@/features/candidates/search-service", () => ({ searchCandidates: mocks.search, searchAssistedCandidates: mocks.assistedSearch, listCandidateSearchCategories: mocks.categories, getAdminCandidate: mocks.candidate }));
vi.mock("@/features/participations/nomination-service", () => ({ listNominationOpenings: mocks.nominations }));
vi.mock("@/features/participations/components/opening-candidate-matches", () => ({ OpeningCandidateMatches: () => <section aria-label="Candidatos coincidentes de prueba" /> }));
vi.mock("@/features/candidates/assisted-service", () => ({ getAssistedWorkspace: mocks.assisted,
 getAssistedCreationPolicy: async () => ({ version: "demo-not-approved", policy_text: "Política ficticia", policy_hash: "a".repeat(64) }) }));
vi.mock("@/features/openings/admin-service", () => ({ listAdminOpenings: mocks.openings, getAdminOpening: mocks.opening }));
vi.mock("@/features/participations/admin-query", () => ({ listAdminParticipations: mocks.participations, getAdminParticipation: mocks.participation }));
vi.mock("@/features/participations/contact-service", () => ({ getContactTimeline: mocks.contacts }));
vi.mock("@/features/metrics/service", () => ({ getMetrics: mocks.metrics, metricsCategories: mocks.metricCategories, MetricsHistoryUnavailable: class extends Error {} }));
vi.mock("@/features/openings/admin-actions", () => ({ moderateOpeningAction: mocks.moderate }));
vi.mock("@/features/candidates/admin-actions", () => ({ candidateAccountDecisionAction: vi.fn() }));
vi.mock("@/features/companies/admin-actions", () => ({ adminCompanyAction: vi.fn() }));
vi.mock("@/features/candidates/assisted-actions", () => ({ saveAssistedAction: vi.fn(), assistedCommandAction: vi.fn() }));
vi.mock("@/features/candidates/claim-actions", () => ({ claimAssistedAction: vi.fn() }));
vi.mock("@/features/participations/evaluation-actions", () => ({ recordEvaluationAction: vi.fn(), adminParticipationAction: vi.fn(), confirmFeedbackAction: vi.fn() }));
vi.mock("@/features/participations/nomination-actions", () => ({ createAdminNominationAction: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/admin/empresas", useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }), redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); }, notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/features/accounts/actions", () => ({ logoutAction: vi.fn() }));
import Candidates from "@/app/(admin)/admin/candidates/page";
import AssistedCandidates from "@/app/(admin)/admin/atencion-presencial/page";
import Candidate from "@/app/(admin)/admin/candidates/[candidateId]/page";
import Assisted from "@/app/(admin)/admin/candidates/assisted/page";

import Companies from "@/app/(admin)/admin/empresas/page";
import Company from "@/app/(admin)/admin/empresas/[companyId]/page";
import Openings from "@/app/(admin)/admin/openings/page";
import Opening from "@/app/(admin)/admin/openings/[openingId]/page";
import Participations from "@/app/(admin)/admin/participations/page";
import Participation from "@/app/(admin)/admin/participations/[participationId]/page";
import Metrics from "@/app/(admin)/admin/metrics/page";
const id = "0a000000-0000-4000-8000-000000000001";
const date = "2026-10-19T12:00:00Z";
const categories = [{ id, name: "Administración", code: "DEMO-A", version: 1 }];
const candidate = { id, display_name: "Persona Ficticia", status: "active", version: 1, account_id: id, accounts: { status: "active", version: 1 }, locality: "Funes", availability: "Disponible", refresh_due_at: "2027-04-19", skills_experience_summary: "Experiencia ficticia en tareas administrativas y atención al público.", candidate_categories: [{ job_categories: categories[0] }] };
const opening = { id, title: "Auxiliar administrativo", status: "pending_review", version: 1, company_profiles: { id, legal_name: "Empresa Ficticia" }, closing_date: "2026-11-30", vacancies: 2, location: "Funes", modality: "Presencial", schedule: "Jornada completa", contract_type: "Permanente", tasks: "Atención al público y organización de documentación.", requirements: "Experiencia administrativa y manejo de herramientas informáticas." };
const participation = { id, status: "received", version: 1, candidate_profiles: { id, display_name: candidate.display_name }, job_openings: { id, title: opening.title }, origin: "candidate_application", created_at: date, feedback_due_at: null };
const company = { id, account_id: id, legal_name: "Empresa Ficticia", status: "active", version: 1, archived_at: null };
const profileData = { name: candidate.display_name, dni: "90000001", email: "persona@example.invalid", phone: "", locality: "Funes", summary: candidate.skills_experience_summary, detail: "Jornada completa", address: "", availability: "available", categories: [id] };
const metricFilters = { from: "2026-10-01", to: "2026-10-19" };
const rows = [
 { indicator: "active_candidates", value: 24, unit: "count", state: "calculated", category_id: null, category_name: null, opening_id: null, opening_title: null },
 { indicator: "companies", value: 8, unit: "count", state: "calculated", category_id: null, category_name: null, opening_id: null, opening_title: null },
 { indicator: "referrals", value: 12, unit: "count", state: "calculated", category_id: null, category_name: null, opening_id: null, opening_title: null },
 { indicator: "coverage_days", value: null, unit: "days", state: "pending", category_id: null, category_name: null, opening_id: id, opening_title: opening.title },
];
const preview = { id, status: "blocked", version: 1, total: 1, valid: 0, invalid: 1, duplicates: 0, rows: [{ id, number: 1, name: candidate.display_name, dni: "90000001", email: "persona@example.invalid", phone: "", locality: "Funes", categories: ["DEMO-A"], availability: "available", summary: "Experiencia ficticia", errors: ["UNKNOWN_CATEGORY"], matches: [], fields: [], decision: null }], hash: "ficticio", mapping: "demo-v1", retryOf: null, failure: null };
beforeEach(() => {
 vi.clearAllMocks(); mocks.guard.mockResolvedValue({ user: { email: "admin@example.invalid" }, client: { from: mocks.from } });
 mocks.from.mockImplementation((table: string) => { const query = { select: () => query, order: () => query, eq: () => query, neq: () => query, range: table === "job_openings" ? mocks.companyOffers : mocks.range, maybeSingle: mocks.company, single: mocks.account, limit: mocks.companyOffers, then: (resolve: (result: unknown) => unknown) => Promise.resolve({ data: null, count: 11, error: null }).then(resolve) }; return query; });
 mocks.range.mockResolvedValue({ data: [company], count: 11, error: null }); mocks.company.mockResolvedValue({ data: company, error: null }); mocks.account.mockResolvedValue({ data: { id, status: "active", version: 1 }, error: null }); mocks.companyOffers.mockResolvedValue({ data: [opening], count: 11, error: null });
 mocks.categories.mockResolvedValue(categories); mocks.search.mockResolvedValue({ total: 11, page: 1, pageCount: 2, items: [{ id, displayName: candidate.display_name, locality: "Funes", availability: "Disponible", categories, referralEligible: true }] });
 mocks.assistedSearch.mockResolvedValue({ total: 11, page: 1, pageCount: 2, items: [{ id, displayName: candidate.display_name, locality: "Funes", status: "draft", availability: null, categories, referralEligible: false }] });
 mocks.candidate.mockResolvedValue({ candidate, currentCv: null, referralEligible: true, participations: [participation], notes: [], audit: [] }); mocks.nominations.mockResolvedValue([opening]);
 mocks.assisted.mockResolvedValue({ categories, workspace: { profile: { ...candidate, origin: "assisted", account_id: null }, data: profileData, requests: [], consent: "accepted", policy: { version: "demo", policy_text: "Consentimiento ficticio de prueba.", policy_hash: "ficticio" } } });
 mocks.openings.mockResolvedValue({ items: [opening], total: 11, page: 1, pageCount: 2 }); mocks.opening.mockResolvedValue({ opening, events: [] });
 mocks.participations.mockResolvedValue({ items: [participation], total: 11, page: 1, pageCount: 2 }); mocks.participation.mockResolvedValue({ participation, audit: [], preinterviews: [], contacts: [], notes: [], referral: null, feedback: [] }); mocks.contacts.mockResolvedValue([]);
 mocks.imports.mockResolvedValue([{ id, created_at: date, status: "blocked", total_rows: 1 }]); mocks.preview.mockResolvedValue(preview);
 mocks.metricCategories.mockResolvedValue(categories); mocks.metrics.mockResolvedValue({ filters: metricFilters, as_of: date, rows });
});
it("puts case identity before actionable guidance and preserves evidence destinations", async () => {
 render(await Participation({ params: Promise.resolve({ participationId: id }) }));
 const identity = screen.getByRole("heading", { name: "Caso", level: 2 });
 const guide = screen.getByRole("region", { name: "Próximo paso" });
 expect(identity.compareDocumentPosition(guide) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(within(guide).getByRole("link", { name: "Ir a la acción disponible" }).getAttribute("href")).toBe("#case-actions");
 expect(document.querySelector("#case-actions")?.getAttribute("tabindex")).toBe("-1");
 expect(document.querySelector("#contact-record")).toBeTruthy();
 expect(screen.getByRole("list", { name: "Etapas del caso" })).toBeTruthy();
});
it("prioritizes confirmation of a pending company response with unique anchors", async () => {
 mocks.participation.mockResolvedValue({ participation: { ...participation, status: "awaiting_feedback" }, audit: [], preinterviews: [], contacts: [], notes: [], referral: null, feedback: [{ id, reported_outcome: "not_selected", reported_at: date, review_status: "pending_admin", message: "Motivo ficticio" }] });
 render(await Participation({ params: Promise.resolve({ participationId: id }) }));
 expect(screen.getByRole("link", { name: "Ir a la acción disponible" }).getAttribute("href")).toBe("#feedback-review");
 const ids = Array.from(document.querySelectorAll("[id]")).map(node => node.id);
 expect(new Set(ids).size).toBe(ids.length);
 const review = document.querySelector("#feedback-review")!;
 expect(review.compareDocumentPosition(document.querySelector("#case-actions")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
it("surfaces existing closing dates in administrative offer summaries", async () => {
 render(await Openings({ searchParams: Promise.resolve({}) }));
 expect(screen.getByRole("region", { name: "Listado de ofertas" }).textContent).toContain("Cierre: 30/11/2026");
});
it("provides real moderation and matching destinations without replacing the approved grid", async () => {
 render(await Opening({ params: Promise.resolve({ openingId: id }), searchParams: Promise.resolve({}) }));
 const guide = screen.getByRole("region", { name: "Próximo paso de la oferta" });
 expect(within(guide).getByRole("link", { name: "Revisar decisión municipal" }).getAttribute("href")).toBe("#opening-moderation");
 expect(document.querySelector("#opening-moderation")).toBeTruthy();
 expect(document.querySelector("#candidate-matches")).toBeTruthy();
});
it.each(["active", "archived"])("retains opaque course history navigation for %s candidates", async status => {
 mocks.candidate.mockResolvedValue({ candidate: { ...candidate, status }, currentCv: null, referralEligible: false, participations: [], notes: [], audit: [] });
 render(await Candidate({ params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) }));
 expect(screen.getByRole("link", { name: "Cursos y derivaciones" }).getAttribute("href")).toBe(`/admin/courses?candidate=${fixtureReference("candidate", id)}`);
});
it("rechaza acceso antes de consultar el padrón", async () => {
 mocks.guard.mockRejectedValue(new Error("FORBIDDEN")); await expect(Candidates({ searchParams: Promise.resolve({}) })).rejects.toThrow("FORBIDDEN"); expect(mocks.search).not.toHaveBeenCalled();
});

it("starts the admin navigation with an operational overview", async () => {
 render(await Metrics({ searchParams: Promise.resolve({}) }));
 const navigation = screen.getByRole("navigation", { name: "Navegación de Oficina de Empleo" });
 const first = within(navigation).getAllByRole("link")[0]!;
 expect(first.getAttribute("href")).toBe("/admin");
 expect(first.textContent).toContain("Panel de administración");
});
it("shows hierarchical breadcrumbs on an administrative detail", async () => {
 render(await Opening({ params: Promise.resolve({ openingId: id }), searchParams: Promise.resolve({}) }));
 const breadcrumbs = screen.getByRole("navigation", { name: "Ruta de navegación" });
 expect(within(breadcrumbs).getByRole("link", { name: "Panel de administración" }).getAttribute("href")).toBe("/admin");
 expect(within(breadcrumbs).getByRole("link", { name: "Ofertas" }).getAttribute("href")).toBe("/admin/openings");
 expect(breadcrumbs.querySelector('[aria-current="page"]')?.textContent).toBe(screen.getByRole("heading", { level: 1 }).textContent);
});
it("loads actual metrics for the guarded daily overview", async () => {
 const { default: Overview } = await import("@/app/(admin)/admin/page");
 render(await Overview());
 expect(mocks.guard).toHaveBeenCalledWith(["admin"]);
 expect(mocks.metrics).toHaveBeenCalledWith(expect.objectContaining({ from: expect.any(String), to: expect.any(String) }));
 const filters = mocks.metrics.mock.calls[0]![0];
 expect(filters.from).toBe(filters.to);
 expect(screen.getByRole("heading", { level: 1, name: "Panel de administración" })).toBeDefined();
 expect(screen.getByTestId("metric-active_candidates").textContent).toContain("24");
 expect(screen.getByTestId("metric-active_candidates").querySelector("[data-metric-bar]")).toBeTruthy();
 expect(screen.getByRole("figure", { name: "Ofertas por estado" })).toBeTruthy();
 expect(document.querySelector("[data-metrics-chart-first] details")).toBeNull();
 expect(screen.queryByText("Indicadores principales")).toBeNull();
 expect(screen.queryByText("Ver detalle")).toBeNull();
});
it("enlaza desde la oferta al perfil de empresa con referencia opaca", async () => {
 render(await Opening({ params: Promise.resolve({ openingId: id }), searchParams: Promise.resolve({}) }));
 expect(screen.getByRole("link", { name: "Ver perfil de la empresa" }).getAttribute("href"))
   .toBe(`/admin/empresas/${fixtureReference("company", id)}`);
});
it("muestra los datos registrados de empresa solo después de exigir admin", async () => {
 mocks.company.mockResolvedValue({ data: { ...company, cuit_display: "20-90000001-3", responsible_name: "Responsable Ficticio", email: "contacto@example.invalid", phone: "3410000000", activity: "Actividad ficticia", locality: "Funes" }, error: null });
 render(await Company({ params: Promise.resolve({ companyId: id }) }));
 expect(mocks.guard).toHaveBeenCalledWith(["admin"]);
 const profile = screen.getByRole("region", { name: "Perfil de la empresa" });
 for (const value of ["20-90000001-3", "Responsable Ficticio", "contacto@example.invalid", "3410000000", "Actividad ficticia", "Funes"]) expect(within(profile).getByText(value)).toBeTruthy();
 expect(within(profile).queryByRole("textbox")).toBeNull();
});
it("explica datos empresariales ausentes sin inventarlos", async () => {
 render(await Company({ params: Promise.resolve({ companyId: id }) }));
 expect(within(screen.getByRole("region", { name: "Perfil de la empresa" })).getAllByText("Sin informar")).toHaveLength(6);
});
it("pagina las ofertas de la empresa más allá del anterior límite de cincuenta", async () => {
 mocks.companyOffers.mockResolvedValue({ data: [opening], count: 55, error: null });
 render(await Company({ params: Promise.resolve({ companyId: id }), searchParams: Promise.resolve({ page: "6" }) }));
 expect(mocks.companyOffers).toHaveBeenCalledWith(50, 59);
 expect(screen.getByText("Página 6 de 6")).toBeTruthy();
 expect(screen.queryByRole("link", { name: "Siguiente" })).toBeNull();
 expect(screen.getByRole("link", { name: "Anterior" }).getAttribute("href"))
   .toBe(`/admin/empresas/${fixtureReference("company", id)}?page=5`);
});
it.each(["0", "1.5", "1001", ["1", "2"]])("no consulta ofertas empresariales con página inválida %j", async page => {
 render(await Company({ params: Promise.resolve({ companyId: id }), searchParams: Promise.resolve({ page }) }));
 expect(mocks.companyOffers).not.toHaveBeenCalled();
 expect(within(screen.getByRole("region", { name: "Ofertas de la empresa" })).getByRole("alert").textContent).toContain("Revisá la página");
});
it("recupera una página empresarial fuera de rango sin enlaces a páginas inexistentes", async () => {
 mocks.companyOffers.mockResolvedValue({ data: [], count: 11, error: null });
 render(await Company({ params: Promise.resolve({ companyId: id }), searchParams: Promise.resolve({ page: "9" }) }));
 expect(screen.getByRole("link", { name: "Volver a la primera página" }).getAttribute("href"))
   .toBe(`/admin/empresas/${fixtureReference("company", id)}?page=1`);
 expect(screen.queryByRole("link", { name: "Anterior" })).toBeNull();
});
it("recupera la respuesta real PGRST103 sin confundirla con empresa inexistente", async () => {
 mocks.companyOffers.mockResolvedValue({ data: null, count: null, error: { code: "PGRST103", message: "Range" } });
 render(await Company({ params: Promise.resolve({ companyId: id }), searchParams: Promise.resolve({ page: "99" }) }));
 expect(screen.getByRole("link", { name: "Volver a la primera página" }).getAttribute("href")).toBe(`/admin/empresas/${fixtureReference("company", id)}?page=1`);
 expect(screen.getByRole("region", { name: "Perfil de la empresa" })).toBeTruthy();
});
it("mantiene filtro y páginas en el listado administrativo general", async () => {
 mocks.openings.mockResolvedValue({ items: [opening], total: 25, page: 2, pageCount: 3 });
 render(await Openings({ searchParams: Promise.resolve({ status: "published", page: "2" }) }));
 expect(mocks.openings).toHaveBeenCalledWith({ status: "published", page: 2, pageSize: 10 });
 for (const [label, page] of [["Anterior", "1"], ["Siguiente", "3"]]) {
   const url = new URL(screen.getByRole("link", { name: label }).getAttribute("href")!, "http://fixture.invalid");
   expect(url.searchParams.get("status")).toBe("published"); expect(url.searchParams.get("page")).toBe(page);
 }
});
it("recupera una página vacía de ofertas conservando el filtro", async () => {
 mocks.openings.mockResolvedValue({ items: [], total: 25, page: 99, pageCount: 3 });
 render(await Openings({ searchParams: Promise.resolve({ status: "published", page: "99" }) }));
 const url = new URL(screen.getByRole("link", { name: "Volver a la primera página" }).getAttribute("href")!, "http://fixture.invalid");
 expect(url.searchParams.get("page")).toBe("1"); expect(url.searchParams.get("status")).toBe("published");
 expect(screen.queryByRole("link", { name: "Anterior" })).toBeNull();
});
it("limita el historial de moderación administrativo a cinco y permite seguir leyendo", async () => {
 mocks.opening.mockResolvedValue({ opening, events: Array.from({ length: 6 }, (_, index) => ({ id: `ficticio-${index}`, decision: "submitted", previous_status: "draft", new_status: "pending_review", created_at: date, actor_type: "system", actor_account_id: null })) });
 render(await Opening({ params: Promise.resolve({ openingId: id }), searchParams: Promise.resolve({}) }));
 const history = screen.getByRole("region", { name: "Historial de moderación" });
 expect(within(history).getAllByRole("listitem")).toHaveLength(5);
 fireEvent.click(within(history).getByRole("button", { name: "Mostrar más" }));
 expect(within(history).getAllByRole("listitem")).toHaveLength(6);
 expect(within(history).queryByRole("button", { name: "Mostrar más" })).toBeNull();
});
it("conserva contactos y notas sin la tarjeta de plantillas", async () => {
 render(await Participation({ params: Promise.resolve({ participationId: id }) }));
 expect(screen.queryByRole("heading", { name: "Plantillas para el personal" })).toBeNull();
 expect(screen.queryByLabelText("Tipo de mensaje")).toBeNull();
 expect(screen.getByRole("region", { name: "Historial de contactos" })).toBeTruthy();
 expect(screen.getByRole("heading", { name: "Registrar contacto municipal" })).toBeTruthy();

});
it("conserva los filtros de candidatos al paginar", async () => {
 render(await Candidates({ searchParams: Promise.resolve({ locality: "Funes" }) })); expect(mocks.guard).toHaveBeenCalledWith(["admin"]);
 const href = screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")!; expect(new URL(href, "http://local").searchParams.get("locality")).toBe("Funes");
});
it("no consulta candidatos con filtros inválidos", async () => {
 render(await Candidates({ searchParams: Promise.resolve({ page: "0" }) })); expect(mocks.search).not.toHaveBeenCalled(); expect(screen.getByRole("alert").textContent).toContain("Revisá los filtros");
});
it("lista perfiles presenciales sin exigir activación y reutiliza sus detalles", async () => {
 render(await AssistedCandidates({ searchParams: Promise.resolve({}) }));
 expect(mocks.guard).toHaveBeenCalledWith(["admin"]);
 expect(mocks.assistedSearch).toHaveBeenCalledWith(expect.objectContaining({ eligibility: "all" }));
 expect(mocks.search).not.toHaveBeenCalled();
 expect(screen.getByText("Borrador")).toBeTruthy();
 expect(screen.getByRole("link", { name: candidate.display_name }).getAttribute("href")).toBe(`/admin/candidates/${fixtureReference("candidate", id)}`);
 expect(screen.getByRole("heading", { name: "Crear perfil asistido" })).toBeTruthy();
 expect(screen.getByLabelText("Nombre y apellido")).toBeTruthy();
 expect(screen.getByRole("button", { name: "Comprobar duplicados y guardar" })).toBeTruthy();
 expect(screen.queryByRole("link", { name: "Nueva atención presencial" })).toBeNull();
});
it("conserva filtros y categoría opaca al paginar atención presencial", async () => {
 render(await AssistedCandidates({ searchParams: Promise.resolve({ categoryId: id, locality: "Funes" }) }));
 const url = new URL(screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")!, "http://fixture.invalid");
 expect(url.pathname).toBe("/admin/atencion-presencial");
 expect(url.searchParams.get("categoryId")).toBe(fixtureReference("category", id));
 expect(url.searchParams.get("locality")).toBe("Funes");
 expect(url.searchParams.get("page")).toBe("2");
});
it("informa ausencia de perfiles presenciales sin crear registros", async () => {
 mocks.assistedSearch.mockResolvedValue({ total: 0, page: 1, pageCount: 0, items: [] });
 render(await AssistedCandidates({ searchParams: Promise.resolve({}) }));
 expect(screen.getByText("Sin perfiles de atención presencial")).toBeTruthy();
 expect(screen.getByRole("button", { name: "Comprobar duplicados y guardar" })).toBeTruthy();
 expect(mocks.assisted).not.toHaveBeenCalled();
});
it("rechaza filtros inválidos sin consultar perfiles presenciales", async () => {
 render(await AssistedCandidates({ searchParams: Promise.resolve({ page: "0" }) }));
 expect(mocks.assistedSearch).not.toHaveBeenCalled();
 expect(screen.getByRole("alert").textContent).toContain("Revisá los filtros");
});
it("rechaza atención presencial antes de consultar categorías o perfiles", async () => {
 mocks.guard.mockRejectedValue(new Error("FORBIDDEN"));
 await expect(AssistedCandidates({ searchParams: Promise.resolve({}) })).rejects.toThrow("FORBIDDEN");
 expect(mocks.categories).not.toHaveBeenCalled(); expect(mocks.assistedSearch).not.toHaveBeenCalled();
});
it("conserva menú y regreso al apartado para un perfil asistido vinculado", async () => {
 mocks.candidate.mockResolvedValue({ candidate: { ...candidate, origin: "assisted" }, currentCv: null, referralEligible: true, participations: [], notes: [], audit: [] });
 render(await Candidate({ params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) }));
 const navigation = screen.getByRole("navigation", { name: "Navegación de Oficina de Empleo" });
 expect(within(navigation).getByRole("link", { name: "Perfil asistido" }).getAttribute("aria-current")).toBe("page");
 expect(navigation.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
 expect(screen.getByRole("link", { name: "Volver a perfil asistido" }).getAttribute("href")).toBe("/admin/atencion-presencial");
});
it("muestra ausencia de CV sin carga, descarga o nominación desde perfil", async () => {
 render(await Candidate({ params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) }));
 expect(screen.getByText("El candidato no tiene un CV vigente.")).toBeTruthy();
 expect(screen.queryByLabelText("Archivo de CV")).toBeNull();
 expect(screen.queryByRole("button", { name: "Cargar CV" })).toBeNull();
 expect(screen.queryByRole("link", { name: "Abrir CV vigente en otra pestaña" })).toBeNull();
 expect(screen.queryByRole("heading", { name: "Nominar a una oferta" })).toBeNull();
 expect(screen.queryByRole("button", { name: "Crear nominación" })).toBeNull();
 expect(mocks.nominations).not.toHaveBeenCalled();
});
it("muestra metadatos y descarga del CV vigente por referencia, sin formulario", async () => {
 mocks.candidate.mockResolvedValue({ candidate, currentCv: { id, original_name_safe: "cv-ficticio.pdf", byte_size: 2048 }, referralEligible: true, participations: [], notes: [], audit: [] });
 render(await Candidate({ params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) }));
 expect(screen.getByText("cv-ficticio.pdf")).toBeTruthy();
 expect(screen.getByRole("link", { name: "Abrir CV vigente en otra pestaña" }).getAttribute("href")).toBe(`/api/cv/${fixtureReference("cv", id)}`);
 expect(screen.queryByLabelText("Archivo de CV")).toBeNull();
});
it.each([
 { status: "active", origin: "self_service" },
 { status: "active", origin: "assisted" },
 { status: "draft", origin: "assisted" },
 { status: "archived", origin: "self_service" },
])("perfil $origin/$status conserva consulta y navegación sin ofrecer nominación", async state => {
 mocks.candidate.mockResolvedValue({ candidate: { ...candidate, ...state }, currentCv: null, referralEligible: false, participations: [participation], notes: [], audit: [] });
 render(await Candidate({ params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) }));
 expect(screen.queryByRole("heading", { name: "Nominar a una oferta" })).toBeNull();
 expect(screen.queryByRole("button", { name: "Crear nominación" })).toBeNull();
 expect(screen.queryByRole("combobox", { name: "Oferta" })).toBeNull();
 expect(screen.getByRole("heading", { name: "Participaciones recientes" })).toBeTruthy();
 const profileDetails = screen.getByRole("region", { name: "Perfil candidato" });
 const noteForm = screen.getByRole("heading", { name: "Nota interna de la Oficina" }).closest("form");
 if (state.status === "archived") {
   expect(screen.queryByRole("region", { name: "CV PDF del candidato" })).toBeNull();
   expect(profileDetails.compareDocumentPosition(noteForm!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 } else {
   const cvDetails = screen.getByRole("region", { name: "CV PDF del candidato" });
   expect(profileDetails.compareDocumentPosition(cvDetails) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
   expect(cvDetails.compareDocumentPosition(noteForm!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 }
 expect(within(screen.getByRole("complementary", { name: "Panel de administración" })).getByRole("link", { name: "Ofertas" }).getAttribute("href")).toBe("/admin/openings");
 expect(mocks.nominations).not.toHaveBeenCalled();
});
it("protege el detalle antes de consultar candidato o CV", async () => {
 mocks.guard.mockRejectedValue(new Error("FORBIDDEN"));
 await expect(Candidate({ params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) })).rejects.toThrow("FORBIDDEN");
 expect(mocks.candidate).not.toHaveBeenCalled();
});
it("no ofrece carga de CV ni mantenimiento para un perfil archivado", async () => {
 mocks.candidate.mockResolvedValue({ candidate: { ...candidate, status: "archived", account_id: null }, referralEligible: false, participations: [], notes: [], audit: [] });
 render(await Candidate({ params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) })); expect(screen.queryByLabelText("Archivo de CV")).toBeNull(); expect(mocks.nominations).not.toHaveBeenCalled();
});
it("muestra candidatos después de la información e historial de oferta y fuera del grid", async () => {
 render(await Opening({ params: Promise.resolve({ openingId: id }), searchParams: Promise.resolve({}) }));
 const details = screen.getByRole("region", { name: "Oferta y empresa" });
 const history = screen.getByRole("region", { name: "Historial de moderación" });
 const matches = screen.getByRole("region", { name: "Candidatos coincidentes de prueba" });
 const decision = screen.getByRole("heading", { name: "Decisión municipal sobre la oferta" }).closest("form");
 const grid = document.querySelector('[data-detail-grid="opening"]');
 expect(details.parentElement).toBe(grid);
 expect(decision?.parentElement?.parentElement).toBe(grid);
 expect(history.parentElement?.parentElement).toBe(grid);
 expect(decision?.parentElement?.nextElementSibling).toBe(history.parentElement);
 const link = screen.getByRole("link", { name: "Ver participaciones de esta oferta" });
 expect(link.getAttribute("href")).toBe(`/admin/participations?openingId=${fixtureReference("opening", id)}`);
 expect(link.className).toContain("min-h-11");
 expect(details.compareDocumentPosition(matches) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(history.compareDocumentPosition(matches) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(matches.closest(".grid")).toBeNull();
});
it("conserva validación y confirmación al suspender una oferta", async () => {
 mocks.opening.mockResolvedValue({ opening: { ...opening, status: "published" }, events: [] });
 render(await Opening({ params: Promise.resolve({ openingId: id }), searchParams: Promise.resolve({}) })); fireEvent.change(screen.getByLabelText("Decisión"), { target: { value: "suspended" } });
 fireEvent.change(screen.getByRole("textbox", { name: /Motivo interno/ }), { target: { value: "Motivo ficticio" } }); fireEvent.click(screen.getByRole("button", { name: "Guardar decisión" }));
 expect(screen.getByRole("checkbox").getAttribute("aria-invalid")).toBe("true");
 expect(screen.getByText("Confirmá esta opción para continuar.")).toBeTruthy(); expect(mocks.moderate).not.toHaveBeenCalled();
});
it("no consulta ofertas con estado inválido", async () => {
 render(await Openings({ searchParams: Promise.resolve({ status: "invalido" }) })); expect(mocks.openings).not.toHaveBeenCalled(); expect(screen.getByRole("alert")).toBeTruthy();
});
it("conserva los IDs de filtro al paginar participaciones", async () => {
 render(await Participations({ searchParams: Promise.resolve({ openingId: id, candidateId: id }) }));
 const params = new URL(screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")!, "http://local").searchParams; expect(params.get("openingId")).toBe(fixtureReference("opening", id)); expect(params.get("candidateId")).toBe(fixtureReference("candidate", id));
});
it("conserva la confirmación obligatoria en las decisiones de empresa", async () => {
 render(await Company({ params: Promise.resolve({ companyId: id }) })); expect(screen.getAllByRole("checkbox")).toHaveLength(2); for (const checkbox of screen.getAllByRole("checkbox")) expect(checkbox).toHaveProperty("required", true);
});
it("renders the same chart-first metrics on the filtered reporting page", async () => {
 render(await Metrics({ searchParams: Promise.resolve(metricFilters) }));
 expect(screen.getByTestId("metric-active_candidates").querySelector("[data-metric-bar]")).toBeTruthy();
 expect(screen.getByRole("figure", { name: "Ofertas por estado" })).toBeTruthy();
 expect(document.querySelector("[data-metrics-chart-first] details")).toBeNull();
 expect(screen.queryByText("Indicadores principales")).toBeNull();
 expect(screen.queryByText("Ver detalle")).toBeNull();
});
it("exporta los filtros consultados y conserva cobertura pendiente", async () => {
 render(await Metrics({ searchParams: Promise.resolve(metricFilters) }));
 for (const [format, label] of [["csv", "CSV"], ["pdf", "PDF"], ["xlsx", "Excel"]]) {
  const href = screen.getByRole("link", { name: `Descargar ${label} filtrado` }).getAttribute("href")!;
  expect(href).toContain(`/api/admin/exports/operations.${format}?from=2026-10-01&to=2026-10-19`);
 }
 expect(screen.getByText("Pendiente de cubrir todas las vacantes")).toBeTruthy();
});
it.each(["active", "draft", "consent_withdrawn", "needs_update"])("integra mantenimiento presencial %s, consentimiento, CV y vinculación sin duplicar notas", async status => {
 mocks.candidate.mockResolvedValue({ candidate: { ...candidate, origin: "assisted", account_id: null, accounts: null, archived_at: null, status }, currentCv: null, referralEligible: false, participations: [], notes: [], audit: [] });
 render(await Candidate({ params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) }));
 expect(mocks.assisted).toHaveBeenCalledWith(id);
 expect(screen.getByRole("heading", { name: "Mantener perfil" })).toBeTruthy();
 expect(screen.getByRole("heading", { name: "Activación" })).toBeTruthy();
 const maintenanceForm = screen.getByRole("heading", { name: "Mantener perfil" }).closest("form");
 const profileDetails = screen.getByRole("region", { name: "Perfil candidato" });
 const cvDetails = screen.getByRole("region", { name: "CV PDF del candidato" });
 expect(maintenanceForm!.compareDocumentPosition(profileDetails) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(profileDetails.compareDocumentPosition(cvDetails) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(cvDetails.compareDocumentPosition(screen.getByRole("heading", { name: "Nota interna de la Oficina" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(profileDetails.closest('[data-detail-cell]')?.nextElementSibling).toBe(cvDetails.closest('[data-detail-cell]'));
 expect(screen.getByLabelText("DNI exhibido")).toHaveProperty("type", "password"); expect(screen.getByRole("button", { name: "Vincular conservando historial" })).toHaveProperty("disabled", true);
 expect(screen.getByLabelText("Archivo de CV").getAttribute("accept")).toBe(".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png");
 expect(screen.getByRole("button", { name: "Cargar CV" })).toBeTruthy();
 expect(screen.getAllByRole("heading", { name: "Notas internas" })).toHaveLength(1);
 expect(screen.getAllByRole("heading", { name: "Historial de cuenta y perfil" })).toHaveLength(1);
 expect(screen.queryByRole("link", { name: "Mantener perfil y atención presencial" })).toBeNull();
});
it.each([
 { origin: "assisted", account_id: id, status: "active", archived_at: null },
 { origin: "self_service", account_id: null, status: "active", archived_at: null },
 { origin: "imported", account_id: null, status: "draft", archived_at: null },
 { origin: "assisted", account_id: null, status: "archived", archived_at: date },
 { origin: "assisted", account_id: null, status: "active", archived_at: date },
])("no carga ni muestra mantenimiento en $origin/$status/cuenta=$account_id/archivo=$archived_at", async state => {
 mocks.candidate.mockResolvedValue({ candidate: { ...candidate, ...state }, currentCv: null, referralEligible: false, participations: [], notes: [], audit: [] });
 render(await Candidate({ params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) }));
 expect(mocks.assisted).not.toHaveBeenCalled();
 expect(screen.queryByRole("heading", { name: "Mantener perfil" })).toBeNull();
 expect(screen.queryByRole("heading", { name: "Activación" })).toBeNull();
 expect(screen.queryByRole("heading", { name: "Vincular cuenta presencialmente" })).toBeNull();
 expect(screen.queryByLabelText("Archivo de CV")).toBeNull();
 expect(screen.getByRole("heading", { name: "Historial de cuenta y perfil" })).toBeTruthy();
});
it("oculta controles si el workspace ya informa una cuenta vinculada", async () => {
 mocks.candidate.mockResolvedValue({ candidate: { ...candidate, origin: "assisted", account_id: null }, currentCv: null, referralEligible: false, participations: [], notes: [], audit: [] });
 const data = await mocks.assisted(); mocks.assisted.mockClear();
 mocks.assisted.mockResolvedValue({ ...data, workspace: { ...data.workspace, profile: { ...data.workspace.profile, account_id: id } } });
 render(await Candidate({ params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) }));
 expect(mocks.assisted).toHaveBeenCalledWith(id);
 expect(screen.queryByRole("heading", { name: "Mantener perfil" })).toBeNull();
 expect(screen.queryByLabelText("Archivo de CV")).toBeNull();
});
it("retira formularios al refrescar tras vincular sin dejar nodos de edición anteriores", async () => {
 mocks.candidate.mockResolvedValue({ candidate: { ...candidate, origin: "assisted", account_id: null, accounts: null }, currentCv: null, referralEligible: false, participations: [], notes: [], audit: [] });
 const props = { params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) };
 const view = render(await Candidate(props));
 expect(screen.getByRole("heading", { name: "Mantener perfil" })).toBeTruthy();
 mocks.candidate.mockResolvedValue({ candidate: { ...candidate, origin: "assisted", version: 2 }, currentCv: null, referralEligible: true, participations: [], notes: [], audit: [] });
 view.rerender(await Candidate(props));
 expect(screen.queryByRole("heading", { name: "Mantener perfil" })).toBeNull();
 expect(screen.queryByLabelText("Archivo de CV")).toBeNull();
 expect(screen.queryByRole("heading", { name: "Activación" })).toBeNull();
 expect(screen.queryByRole("heading", { name: "Vincular cuenta presencialmente" })).toBeNull();
 expect(screen.getAllByRole("heading", { name: "Nota interna de la Oficina" })).toHaveLength(1);
 expect(screen.getByRole("heading", { name: "Historial de cuenta y perfil" })).toBeTruthy();
});
it.each(["active", "suspended", "pending_verification", "archived"])("el asistido vinculado tiene los mismos controles que un perfil normal con cuenta %s", async status => {
 const props = { params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) };
 const result = { candidate: { ...candidate, origin: "self_service", accounts: { status, version: 1 } }, currentCv: { id, original_name_safe: "cv-ficticio.pdf", byte_size: 2048 }, referralEligible: false, participations: [participation], notes: [], audit: [] };
 mocks.candidate.mockResolvedValue(result);
 const first = render(await Candidate(props));
 const controls = within(screen.getByRole("main")).getAllByRole("button").map(element => element.textContent);
 const headings = within(screen.getByRole("main")).getAllByRole("heading").map(element => element.textContent);
 first.unmount();
 mocks.candidate.mockResolvedValue({ ...result, candidate: { ...result.candidate, origin: "assisted" } });
 render(await Candidate(props));
 expect(within(screen.getByRole("main")).getAllByRole("button").map(element => element.textContent)).toEqual(controls);
 expect(within(screen.getByRole("main")).getAllByRole("heading").map(element => element.textContent).sort()).toEqual([...headings].sort());
 expect(screen.getByRole("link", { name: "Abrir CV vigente en otra pestaña" })).toBeTruthy();
 expect(mocks.assisted).not.toHaveBeenCalled();
});

it("ofrece navegación completa y un único encabezado principal", async () => {
 render(await Companies({ searchParams: Promise.resolve({}) })); const nav = screen.getByRole("navigation", { name: "Navegación de Oficina de Empleo" }); expect(within(nav).getByRole("link", { name: "Empresas" }).getAttribute("aria-current")).toBe("page"); expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});
it.each([
 ["candidates", () => Candidates({ searchParams: Promise.resolve({}) }), "/admin/candidates"],
 ["candidate", () => Candidate({ params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) }), "/admin/candidates"],
 ["assisted", () => Assisted(), "/admin/atencion-presencial"],

 ["companies", () => Companies({ searchParams: Promise.resolve({}) }), "/admin/empresas"],
 ["company", () => Company({ params: Promise.resolve({ companyId: id }) }), "/admin/empresas"],
 ["openings", () => Openings({ searchParams: Promise.resolve({}) }), "/admin/openings"],
 ["opening", () => Opening({ params: Promise.resolve({ openingId: id }), searchParams: Promise.resolve({}) }), "/admin/openings"],
 ["participations", () => Participations({ searchParams: Promise.resolve({}) }), "/admin/participations"],
 ["participation", () => Participation({ params: Promise.resolve({ participationId: id }) }), "/admin/participations"],
 ["metrics", () => Metrics({ searchParams: Promise.resolve(metricFilters) }), "/admin/metrics"],
] as const)("renders %s in the shared administrator workspace", async (section, page, active) => {
 const view = render(await page());
 const sidebar = screen.getByRole("complementary", { name: "Panel de administración" });
 const main = screen.getByRole("main");
 expect(screen.getAllByRole("main")).toHaveLength(1);
 expect(main.querySelector('[data-slot="admin-canvas"]')).toBeTruthy();
 expect(main.querySelectorAll("h1")).toHaveLength(1);
 expect(within(sidebar).getByText("Administración")).toBeTruthy();
 expect(within(sidebar).getByTitle("admin@example.invalid")).toBeTruthy();
 const nav = within(sidebar).getByRole("navigation", { name: "Navegación de Oficina de Empleo" });
 expect(within(nav).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/admin", "/admin/candidates", "/admin/atencion-presencial", "/admin/empresas", "/admin/openings", "/admin/participations", "/admin/courses", "/admin/metrics", "/admin/notificaciones", "/account"]);
 expect(nav.querySelector('[aria-current="page"]')?.getAttribute("href")).toBe(active);
 expect(within(sidebar).getByRole("button", { name: "Cerrar sesión" })).toBeTruthy();
 expect(within(main).queryByRole("button", { name: "Cerrar sesión" })).toBeNull();
 expect(document.querySelector("header[data-home]")).toBeTruthy();
 expect(within(main).getByText(/Información de uso interno/)).toBeTruthy();
 saveFixture(section, view.container.innerHTML);
});

function saveFixture(section: string, html: string) {
 const output = process.env.ADMIN_WORKSPACE_FIXTURE_DIR;
 if (!output) return;
 const modules = [
  ["src/app/(auth)/account/account.module.css", accountStyles],
  ["src/app/(public)/home.module.css", homeStyles],
  ["src/components/forms/form.module.css", formStyles],
  ["src/app/(admin)/_components/admin-workspace.module.css", adminStyles],
 ] as const;
 const css = modules.map(([file, names]) => readFileSync(file, "utf8").replace(/\.([a-zA-Z_][\w-]*)/g, (selector, name: string) => names[name] ? `.${names[name]}` : selector)).join("\n");
 mkdirSync(output, { recursive: true });
 writeFileSync(path.join(output, `${section}.json`), JSON.stringify({ section, html, css }));
}
it("muestra los estados con el badge compartido en las superficies administrativas", async () => {
 const openingsView = render(await Openings({ searchParams: Promise.resolve({}) }));
 const openingBadge = openingsView.container.querySelector<HTMLElement>("[class*='border-status-']");
 expect(openingBadge?.textContent?.trim()).toBe("Pendiente de revisión");
 expect(openingBadge?.className).toContain("border-status-amber");
 openingsView.unmount();
 const participationsView = render(await Participations({ searchParams: Promise.resolve({}) }));
 const participationBadge = participationsView.container.querySelector<HTMLElement>("[class*='border-status-']");
 expect(participationBadge?.textContent?.trim()).toBe("Recibida");
 expect(participationBadge?.className).toContain("border-status-neutral");
 participationsView.unmount();
});

it.each([
 ["alta presencial", () => Assisted()],
 ["seguimiento", () => Participation({ params: Promise.resolve({ participationId: id }) })],
] as const)("protege %s antes de leer datos", async (_name, page) => {
 mocks.guard.mockRejectedValue(new Error("FORBIDDEN")); await expect(page()).rejects.toThrow("FORBIDDEN");
 expect(mocks.assisted).not.toHaveBeenCalled(); expect(mocks.participation).not.toHaveBeenCalled();
});

vi.mock("@/lib/records/references", async () => (await import("../../fixtures/record-references")).referenceMocks);
vi.mock("@/lib/records/page-references", async () => (await import("../../fixtures/record-references")).pageReferenceMocks);
vi.mock("@/lib/records/reference-url", async () => {
  const { fixtureHref } = await import("../../fixtures/record-references");
  return { referenceUrl: async (href: string) => fixtureHref(href), canonicalReferenceRoute: async () => {} };
});
vi.mock("@/components/ui/record-link", async () => (await import("../../fixtures/record-references")).recordLinkMocks);
