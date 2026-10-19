import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), search: vi.fn(), categories: vi.fn(), candidate: vi.fn(), nominations: vi.fn(), assisted: vi.fn(), openings: vi.fn(), opening: vi.fn(), participations: vi.fn(), participation: vi.fn(), contacts: vi.fn(), imports: vi.fn(), preview: vi.fn(), metrics: vi.fn(), metricCategories: vi.fn(), from: vi.fn(), range: vi.fn(), company: vi.fn(), account: vi.fn(), companyOffers: vi.fn(), moderate: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireActiveAccount: mocks.guard }));
vi.mock("@/features/candidates/search-service", () => ({ searchCandidates: mocks.search, listCandidateSearchCategories: mocks.categories, getAdminCandidate: mocks.candidate }));
vi.mock("@/features/participations/nomination-service", () => ({ listNominationOpenings: mocks.nominations }));
vi.mock("@/features/participations/components/opening-candidate-matches", () => ({ OpeningCandidateMatches: () => <section aria-label="Candidatos coincidentes de prueba" /> }));
vi.mock("@/features/candidates/assisted-service", () => ({ getAssistedWorkspace: mocks.assisted }));
vi.mock("@/features/openings/admin-service", () => ({ listAdminOpenings: mocks.openings, getAdminOpening: mocks.opening }));
vi.mock("@/features/participations/admin-query", () => ({ listAdminParticipations: mocks.participations, getAdminParticipation: mocks.participation }));
vi.mock("@/features/participations/contact-service", () => ({ getContactTimeline: mocks.contacts }));
vi.mock("@/features/imports/preview-service", () => ({ listImports: mocks.imports, getImportPreview: mocks.preview }));
vi.mock("@/features/metrics/service", () => ({ getMetrics: mocks.metrics, metricsCategories: mocks.metricCategories, MetricsHistoryUnavailable: class extends Error {} }));
vi.mock("@/features/openings/admin-actions", () => ({ moderateOpeningAction: mocks.moderate }));
vi.mock("@/features/candidates/admin-actions", () => ({ candidateAccountDecisionAction: vi.fn() }));
vi.mock("@/features/companies/admin-actions", () => ({ adminCompanyAction: vi.fn() }));
vi.mock("@/features/candidates/assisted-actions", () => ({ saveAssistedAction: vi.fn(), assistedCommandAction: vi.fn() }));
vi.mock("@/features/candidates/claim-actions", () => ({ claimAssistedAction: vi.fn() }));
vi.mock("@/features/participations/evaluation-actions", () => ({ recordEvaluationAction: vi.fn(), adminParticipationAction: vi.fn(), confirmFeedbackAction: vi.fn() }));
vi.mock("@/features/participations/nomination-actions", () => ({ createAdminNominationAction: vi.fn() }));
vi.mock("@/features/imports/actions", () => ({ resolveImportAction: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }), notFound: () => { throw new Error("NOT_FOUND"); } }));
import Candidates from "@/app/(admin)/admin/candidates/page";
import Candidate from "@/app/(admin)/admin/candidates/[candidateId]/page";
import Assisted from "@/app/(admin)/admin/candidates/assisted/page";
import AssistedDetail from "@/app/(admin)/admin/candidates/assisted/[candidateId]/page";
import Companies from "@/app/(admin)/admin/empresas/page";
import Company from "@/app/(admin)/admin/empresas/[companyId]/page";
import Openings from "@/app/(admin)/admin/openings/page";
import Opening from "@/app/(admin)/admin/openings/[openingId]/page";
import Participations from "@/app/(admin)/admin/participations/page";
import Participation from "@/app/(admin)/admin/participations/[participationId]/page";
import Imports from "@/app/(admin)/admin/imports/page";
import ImportNew from "@/app/(admin)/admin/imports/new/page";
import ImportPreviewPage from "@/app/(admin)/admin/imports/[batchId]/page";
import Metrics from "@/app/(admin)/admin/metrics/page";
const id = "0a000000-0000-4000-8000-000000000001";
const date = "2026-10-19T12:00:00Z";
const categories = [{ id, name: "Administración", code: "DEMO-A", version: 1 }];
const candidate = { id, display_name: "Persona Ficticia", status: "active", version: 1, account_id: id, accounts: { status: "active", version: 1 }, locality: "Funes", availability: "Disponible", refresh_due_at: "2027-04-19", skills_experience_summary: "Experiencia ficticia en tareas administrativas y atención al público.", candidate_categories: [{ job_categories: categories[0] }] };
const opening = { id, title: "Auxiliar administrativo", status: "pending_review", version: 1, company_profiles: { legal_name: "Empresa Ficticia" }, closing_date: "2026-11-30", vacancies: 2, location: "Funes", modality: "Presencial", schedule: "Jornada completa", contract_type: "Permanente", tasks: "Atención al público y organización de documentación.", requirements: "Experiencia administrativa y manejo de herramientas informáticas." };
const participation = { id, status: "received", version: 1, candidate_profiles: { id, display_name: candidate.display_name }, job_openings: { id, title: opening.title }, origin: "candidate_application", created_at: date, feedback_due_at: null };
const company = { id, account_id: id, legal_name: "Empresa Ficticia", status: "active", version: 1, archived_at: null };
const profileData = { name: candidate.display_name, dni: "90000001", email: "persona@example.invalid", phone: "", locality: "Funes", summary: candidate.skills_experience_summary, detail: "Jornada completa", address: "", availability: "available", categories: [id], interests: [] };
const metricFilters = { from: "2026-10-01", to: "2026-10-19" };
const rows = [
 { indicator: "active_candidates", value: 24, unit: "count", state: "calculated", category_id: null, category_name: null, opening_id: null, opening_title: null },
 { indicator: "companies", value: 8, unit: "count", state: "calculated", category_id: null, category_name: null, opening_id: null, opening_title: null },
 { indicator: "referrals", value: 12, unit: "count", state: "calculated", category_id: null, category_name: null, opening_id: null, opening_title: null },
 { indicator: "coverage_days", value: null, unit: "days", state: "pending", category_id: null, category_name: null, opening_id: id, opening_title: opening.title },
];
const preview = { id, status: "blocked", version: 1, total: 1, valid: 0, invalid: 1, duplicates: 0, rows: [{ id, number: 1, name: candidate.display_name, dni: "90000001", email: "persona@example.invalid", phone: "", locality: "Funes", categories: ["DEMO-A"], availability: "available", summary: "Experiencia ficticia", errors: ["UNKNOWN_CATEGORY"], matches: [], fields: [], decision: null }], hash: "ficticio", mapping: "demo-v1", retryOf: null, failure: null };
beforeEach(() => {
 vi.clearAllMocks(); mocks.guard.mockResolvedValue({ client: { from: mocks.from } });
 mocks.from.mockImplementation(() => { const query = { select: () => query, order: () => query, eq: () => query, range: mocks.range, maybeSingle: mocks.company, single: mocks.account, limit: mocks.companyOffers }; return query; });
 mocks.range.mockResolvedValue({ data: [company], count: 11, error: null }); mocks.company.mockResolvedValue({ data: company, error: null }); mocks.account.mockResolvedValue({ data: { id, status: "active", version: 1 }, error: null }); mocks.companyOffers.mockResolvedValue({ data: [opening], error: null });
 mocks.categories.mockResolvedValue(categories); mocks.search.mockResolvedValue({ total: 11, page: 1, pageCount: 2, items: [{ id, displayName: candidate.display_name, locality: "Funes", availability: "Disponible", categories, referralEligible: true }] });
 mocks.candidate.mockResolvedValue({ candidate, referralEligible: true, participations: [participation], notes: [], audit: [] }); mocks.nominations.mockResolvedValue([opening]);
 mocks.assisted.mockResolvedValue({ categories, workspace: { profile: { ...candidate, origin: "assisted", account_id: null }, data: profileData, requests: [], consent: "accepted", policy: { version: "demo", policy_text: "Consentimiento ficticio de prueba.", policy_hash: "ficticio" } } });
 mocks.openings.mockResolvedValue({ items: [opening], total: 11, page: 1, pageCount: 2 }); mocks.opening.mockResolvedValue({ opening, events: [] });
 mocks.participations.mockResolvedValue({ items: [participation], total: 11, page: 1, pageCount: 2 }); mocks.participation.mockResolvedValue({ participation, audit: [], preinterviews: [], contacts: [], notes: [], referral: null, feedback: [] }); mocks.contacts.mockResolvedValue([]);
 mocks.imports.mockResolvedValue([{ id, created_at: date, status: "blocked", total_rows: 1 }]); mocks.preview.mockResolvedValue(preview);
 mocks.metricCategories.mockResolvedValue(categories); mocks.metrics.mockResolvedValue({ filters: metricFilters, as_of: date, rows });
});
it("rechaza acceso antes de consultar el padrón", async () => {
 mocks.guard.mockRejectedValue(new Error("FORBIDDEN")); await expect(Candidates({ searchParams: Promise.resolve({}) })).rejects.toThrow("FORBIDDEN"); expect(mocks.search).not.toHaveBeenCalled();
});
it("conserva los filtros de candidatos al paginar", async () => {
 render(await Candidates({ searchParams: Promise.resolve({ locality: "Funes" }) })); expect(mocks.guard).toHaveBeenCalledWith(["admin"]);
 const href = screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")!; expect(new URL(href, "http://local").searchParams.get("locality")).toBe("Funes");
});
it("no consulta candidatos con filtros inválidos", async () => {
 render(await Candidates({ searchParams: Promise.resolve({ page: "0" }) })); expect(mocks.search).not.toHaveBeenCalled(); expect(screen.getByRole("alert").textContent).toContain("Revisá los filtros");
});
it("conserva los controles PDF y la nominación de un perfil activo", async () => {
 render(await Candidate({ params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) }));
 expect(screen.getByLabelText("Archivo PDF").getAttribute("accept")).toBe(".pdf,application/pdf"); expect(mocks.nominations).toHaveBeenCalledOnce();
});
it("no ofrece carga de CV ni mantenimiento para un perfil archivado", async () => {
 mocks.candidate.mockResolvedValue({ candidate: { ...candidate, status: "archived", account_id: null }, referralEligible: false, participations: [], notes: [], audit: [] });
 render(await Candidate({ params: Promise.resolve({ candidateId: id }), searchParams: Promise.resolve({}) })); expect(screen.queryByLabelText("Archivo PDF")).toBeNull(); expect(mocks.nominations).not.toHaveBeenCalled();
});
it("muestra candidatos después de la información e historial de oferta y fuera del grid", async () => {
 render(await Opening({ params: Promise.resolve({ openingId: id }), searchParams: Promise.resolve({}) }));
 const details = screen.getByRole("region", { name: "Oferta y empresa" });
 const history = screen.getByRole("region", { name: "Historial de moderación" });
 const matches = screen.getByRole("region", { name: "Candidatos coincidentes de prueba" });
 expect(details.compareDocumentPosition(matches) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(history.compareDocumentPosition(matches) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(matches.closest(".grid")).toBeNull();
});
it("conserva validación y confirmación al suspender una oferta", async () => {
 render(await Opening({ params: Promise.resolve({ openingId: id }), searchParams: Promise.resolve({}) })); fireEvent.change(screen.getByLabelText("Decisión"), { target: { value: "suspended" } });
 fireEvent.change(screen.getByRole("textbox", { name: /Motivo interno/ }), { target: { value: "Motivo ficticio" } }); fireEvent.click(screen.getByRole("button", { name: "Guardar decisión" }));
 expect(screen.getByRole("alert").textContent).toContain("Confirmá expresamente"); expect(mocks.moderate).not.toHaveBeenCalled();
});
it("no consulta ofertas con estado inválido", async () => {
 render(await Openings({ searchParams: Promise.resolve({ status: "invalido" }) })); expect(mocks.openings).not.toHaveBeenCalled(); expect(screen.getByRole("alert")).toBeTruthy();
});
it("conserva los IDs de filtro al paginar participaciones", async () => {
 render(await Participations({ searchParams: Promise.resolve({ openingId: id, candidateId: id }) }));
 const params = new URL(screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")!, "http://local").searchParams; expect(params.get("openingId")).toBe(id); expect(params.get("candidateId")).toBe(id);
});
it("conserva la confirmación obligatoria en las decisiones de empresa", async () => {
 render(await Company({ params: Promise.resolve({ companyId: id }) })); expect(screen.getAllByRole("checkbox")).toHaveLength(2); for (const checkbox of screen.getAllByRole("checkbox")) expect(checkbox).toHaveProperty("required", true);
});
it("bloquea confirmación de una importación inválida", async () => {
 render(await ImportPreviewPage({ params: Promise.resolve({ batchId: id }) })); expect(screen.getByRole("button", { name: "Confirmar importación" })).toHaveProperty("disabled", true);
});
it("mantiene el dato ficticio como requisito antes de cargar un CSV", async () => {
 render(await ImportNew({ searchParams: Promise.resolve({ retry: id }) })); expect(screen.getByRole("checkbox")).toHaveProperty("required", true); expect(screen.getByLabelText("CSV ficticio").getAttribute("accept")).toBe(".csv,text/csv");
});
it("exporta los filtros consultados y conserva cobertura pendiente", async () => {
 render(await Metrics({ searchParams: Promise.resolve(metricFilters) })); expect(screen.getByRole("link", { name: "Descargar CSV filtrado" }).getAttribute("href")).toContain("from=2026-10-01&to=2026-10-19"); expect(screen.getByText("Pendiente de cubrir todas las vacantes")).toBeTruthy();
});
it("mantiene DNI oculto y vinculación inhabilitada sin solicitud", async () => {
 render(await AssistedDetail({ params: Promise.resolve({ candidateId: id }) })); expect(screen.getByLabelText("DNI exhibido")).toHaveProperty("type", "password"); expect(screen.getByRole("button", { name: "Vincular conservando historial" })).toHaveProperty("disabled", true);
});
it("ofrece navegación completa y un único encabezado principal", async () => {
 render(await Companies({ searchParams: Promise.resolve({}) })); const nav = screen.getByRole("navigation", { name: "Navegación de Oficina de Empleo" }); expect(within(nav).getByRole("link", { name: "Empresas" }).getAttribute("aria-current")).toBe("page"); expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});
it.each([
 ["alta presencial", () => Assisted()],
 ["historial de importaciones", () => Imports()],
 ["seguimiento", () => Participation({ params: Promise.resolve({ participationId: id }) })],
] as const)("protege %s antes de leer datos", async (_name, page) => {
 mocks.guard.mockRejectedValue(new Error("FORBIDDEN")); await expect(page()).rejects.toThrow("FORBIDDEN");
 expect(mocks.assisted).not.toHaveBeenCalled(); expect(mocks.imports).not.toHaveBeenCalled(); expect(mocks.participation).not.toHaveBeenCalled();
});
