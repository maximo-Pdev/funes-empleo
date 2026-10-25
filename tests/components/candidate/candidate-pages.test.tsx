import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), workspace: vi.fn(), offers: vi.fn(), selected: vi.fn(), participations: vi.fn(), policy: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireActiveAccount: mocks.guard }));
vi.mock("@/features/candidates/profile-service", () => ({ getCandidateWorkspace: mocks.workspace }));
vi.mock("@/features/candidates/photo-service", () => ({ getCandidatePhoto: vi.fn().mockResolvedValue(null), getPhotoCleanupPending: vi.fn().mockResolvedValue(false) }));
vi.mock("@/features/candidates/consent-service", () => ({ getDemoConsentPolicy: mocks.policy }));
vi.mock("@/features/openings/public-service", () => ({ listPublicOffers: mocks.offers, getPublicOffer: mocks.selected }));
vi.mock("@/features/participations/candidate-service", () => ({ listMyParticipations: mocks.participations }));
vi.mock("@/features/candidates/profile-actions", () => ({ saveProfileAction: vi.fn(), savePhoneAction: vi.fn(), activateProfileAction: vi.fn() }));
vi.mock("@/features/candidates/consent-actions", () => ({ changeConsentAction: vi.fn() }));
vi.mock("@/features/participations/candidate-actions", () => ({ applyToOfferAction: vi.fn(), withdrawParticipationAction: vi.fn() }));
vi.mock("@/features/accounts/actions", () => ({ logoutAction: vi.fn(), accountStatusAction: vi.fn() }));
vi.mock("@/features/accounts/navigation", () => ({ getPanelHref: () => "/dashboard" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }), usePathname: () => "/account" }));
import { getCandidatePhoto, getPhotoCleanupPending } from "@/features/candidates/photo-service";
import DashboardPage from "@/app/(auth)/dashboard/page";
const OffersPage = async ({ searchParams }: { searchParams: Promise<{ oferta?: string; page?: string }> }) => {
 accountSession();
 return DashboardPage({ searchParams: searchParams.then(params => ({ ...params, section: "ofertas" })) });
};
const ProfilePage = async ({ searchParams }: { searchParams: Promise<{ cv?: string }> }) => {
 accountSession();
 return DashboardPage({ searchParams: searchParams.then(params => ({ ...params, section: "perfil" })) });
};
const ParticipationsPage = async () => {
 accountSession();
 return DashboardPage({ searchParams: Promise.resolve({ section: "postulaciones" }) });
};
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import accountStyles from "@/app/(auth)/account/account.module.css";
import homeStyles from "@/app/(public)/home.module.css";
import profileStyles from "@/features/candidates/components/profile-panel.module.css";
import formStyles from "@/components/forms/form.module.css";
import candidateStyles from "@/app/(candidate)/candidato/_components/candidate-forms.module.css";
import { AppError } from "@/lib/errors/public-error";
import AccountPage from "@/app/(auth)/account/page";
import { logoutAction } from "@/features/accounts/actions";

const offer = { id: "0a000000-0000-4000-8000-000000000001", slug: "titulo-original-a1b2c3d4e5f6", title: "Auxiliar administrativo", company_name: "Empresa Ficticia", location: "Funes", closing_date: "2026-11-30", tasks: "Tareas ficticias", requirements: "Experiencia", vacancies: 1, modality: "Presencial", schedule: "Completo", contract_type: "Permanente", salary: null, benefits: null, categories: [] };
function workspace(status = "active") { return { bootstrap: "ready", profile: { id: offer.id, display_name: "Persona Ficticia", locality: "Funes", skills_experience_summary: "Experiencia ficticia de atención y administración", availability: "available", availability_detail: "", status, version: 1, refresh_due_at: "2027-04-07" }, privateData: { dni_display: "90000001", address: null }, contacts: [], categories: [{ category_id: offer.id }], allCategories: [{ id: offer.id, name: "Administración", code: "ADMIN" }], consent: { status: "accepted", policy_version: "demo", recorded_at: "2026-10-07" }, cv: { id: offer.id, original_name_safe: "cv-ficticio.pdf", byte_size: 500 }, account: { version: 1 } }; }
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue(undefined); mocks.workspace.mockResolvedValue(workspace()); mocks.offers.mockResolvedValue({ items: [offer], page: 1, pageSize: 10, total: 11 }); mocks.selected.mockResolvedValue(offer); mocks.participations.mockResolvedValue([]); mocks.policy.mockResolvedValue({ version: "demo-not-approved", policy_hash: "demo", policy_text: "Consentimiento ficticio de prueba." }); });
function accountSession() {
 mocks.guard.mockResolvedValue({ account: { id: "candidate-fixture", role: "candidate", status: "active", version: 1 }, user: { email: "persona@example.test" } });
}
// Optional standalone browser fixtures render the real account tree with explicitly fictitious service data.
it.each([
 ["dashboard", "Panel de usuario"], ["perfil", null],
 ["postulaciones", "Mis postulaciones"], ["ofertas", "Ofertas para postularme"], ["cuenta", "Cuenta"],
])("renders shared candidate canvas fixture: %s", async (section, heading) => {
 accountSession();
 const view = render(await DashboardPage({ searchParams: Promise.resolve({ section: section! }) }));
 const output = process.env.CANDIDATE_WORKSPACE_FIXTURE_DIR;
 if (output) {
  const modules = [
   ["src/app/(auth)/account/account.module.css", accountStyles],
   ["src/app/(public)/home.module.css", homeStyles],
   ["src/features/candidates/components/profile-panel.module.css", profileStyles],
   ["src/components/forms/form.module.css", formStyles],
   ["src/app/(candidate)/candidato/_components/candidate-forms.module.css", candidateStyles],
  ] as const;
  const css = modules.map(([file, names]) => {
   const source = readFileSync(file, "utf8");
   return source.replace(/\.([a-zA-Z_][\w-]*)/g, (selector, name: string) => names[name] ? `.${names[name]}` : selector);
  }).join("\n");
  mkdirSync(output, { recursive: true });
  writeFileSync(path.join(output, `${section}.json`), JSON.stringify({ section, fixture: "actual candidate component tree; fictitious mocked service data, not a real account", html: view.container.innerHTML, css }));
 }
 const main = screen.getByRole("main");
 const canvas = main.querySelector(`[data-slot="${section === "perfil" ? "profile" : "candidate"}-canvas"]`);
 expect(canvas).not.toBeNull();
 expect(main.childElementCount).toBe(1);
 expect(canvas?.className.split(" ")).toContain(accountStyles.candidateCanvas);
 expect(main.className.split(" ")).toContain(accountStyles.candidateWorkspace);
 if (heading) expect(canvas?.contains(screen.getByRole("heading", { level: 1, name: heading }))).toBe(true);
 expect(canvas?.textContent).toContain("La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.");
});
it("renders the requested profile inside its canvas with sidebar identity and navigation intact", async () => {
 accountSession();
 render(await AccountPage({ searchParams: Promise.resolve({ section: "perfil" }) }));
 const sidebar = screen.getByRole("complementary", { name: "Panel de usuario" });
 const navigation = within(sidebar).getByRole("navigation", { name: "Secciones de mi cuenta" });
 expect(within(navigation).getAllByRole("link").map(link => link.textContent)).toEqual(["Panel de usuario", "Perfil", "Postulaciones", "Ofertas", "Cuenta"]);
 expect(within(navigation).getByRole("link", { name: "Perfil" }).getAttribute("aria-current")).toBe("page");
 expect(within(sidebar).getByText("Persona Ficticia")).toBeTruthy();
 expect(within(sidebar).getByText("persona@example.test")).toBeTruthy();
 expect(within(sidebar).getByRole("img", { name: "Foto de perfil de ejemplo" })).toBeTruthy();
 expect(within(sidebar).getByRole("button", { name: "Cerrar sesión" })).toBeTruthy();
 expect(within(screen.getByRole("main")).queryByRole("button", { name: "Cerrar sesión" })).toBeNull();
 expect(screen.getByRole("main").childElementCount).toBe(1);
 expect(screen.getByRole("main").querySelector('[data-slot="profile-canvas"]')?.contains(screen.getByLabelText("Nombre y apellido"))).toBe(true);
 expect(screen.getByRole("main").getAttribute("aria-label")).toBe("Perfil");
 expect(mocks.policy).toHaveBeenCalledOnce();
 expect(screen.queryByRole("button", { name: /Archivar/ })).toBeNull();
 expect(screen.getAllByRole("main")).toHaveLength(1);
 expect(screen.getByRole("main").id).toBe("contenido");
 expect(screen.queryByRole("link", { name: "Cambiar contraseña" })).toBeNull();
 expect(document.querySelector('input[name="returnTo"]')).toHaveProperty("value", "/account?section=perfil");
 expect(mocks.workspace).toHaveBeenCalledOnce();
});
it.each(["photo", "cleanup"])("keeps profile usable when the %s query fails before photo deployment", async failed => {
 accountSession();
 const query = failed === "photo" ? getCandidatePhoto : getPhotoCleanupPending;
 vi.mocked(query).mockRejectedValueOnce(new Error(failed === "photo" ? "PHOTO_READ_FAILED" : "PHOTO_CLEANUP_READ_FAILED"));
 render(await AccountPage({ searchParams: Promise.resolve({ section: "perfil" }) }));
 expect(screen.getByLabelText("Nombre y apellido")).toHaveProperty("value", "Persona Ficticia");
 expect(screen.getByRole("button", { name: "Guardar teléfono" })).toHaveProperty("disabled", false);
 expect(screen.getByRole("heading", { name: "CV PDF" })).toBeTruthy();
 expect(screen.getByRole("heading", { name: "Consentimiento de prueba" })).toBeTruthy();
 expect(screen.getByRole("button", { name: "Subir foto" })).toHaveProperty("disabled", true);
 expect(screen.getByRole("button", { name: "Eliminar foto" })).toHaveProperty("disabled", true);
 expect(screen.getByText("La foto de perfil no está disponible en este momento. Podés completar el resto de tus datos.")).toBeTruthy();
 expect(screen.queryByText(/PHOTO_READ_FAILED|PHOTO_CLEANUP_READ_FAILED/)).toBeNull();
});
it("opens the user dashboard by default with participation metrics and states", async () => {
 accountSession();
 mocks.participations.mockResolvedValue([
  { id: "abierta", opening_title: "Oferta en curso", display_status: "received", version: 2, created_at: "2026-10-07" },
  { id: "cerrada", opening_title: "Oferta cerrada", display_status: "cancelled", version: 3, created_at: "2026-10-01" },
 ]);
 render(await AccountPage({ searchParams: Promise.resolve({}) }));
 const sidebar = screen.getByRole("complementary", { name: "Panel de usuario" });
 const navigation = within(sidebar).getByRole("navigation", { name: "Secciones de mi cuenta" });
 expect(within(navigation).getAllByRole("link").map(link => link.textContent)).toEqual(["Panel de usuario", "Perfil", "Postulaciones", "Ofertas", "Cuenta"]);
 expect(within(navigation).getByRole("link", { name: "Panel de usuario" }).getAttribute("aria-current")).toBe("page");
 expect(screen.getByRole("heading", { level: 1, name: "Panel de usuario" })).toBeTruthy();
 expect(screen.getByRole("heading", { name: "Postulaciones en curso" })).toBeTruthy();
 expect(screen.getByRole("heading", { name: "Postulaciones cerradas" })).toBeTruthy();
 expect(screen.getByRole("heading", { name: "Oferta en curso" })).toBeTruthy();
 expect(screen.getByText("Recibida por la Oficina")).toBeTruthy();
 expect(screen.getByText("Cancelada")).toBeTruthy();
 expect(screen.getByRole("link", { name: "Revisar perfil" }).getAttribute("href")).toBe("/account?section=perfil");
 expect(mocks.workspace).toHaveBeenCalledOnce();
});
it.each([
 ["/account", AccountPage], ["/dashboard", DashboardPage],
] as const)("keeps password access in Cuenta and logout in the sidebar at %s", async (basePath, Page) => {
 accountSession();
 render(await Page({ searchParams: Promise.resolve({ section: "cuenta" }) }));
 const sidebar = screen.getByRole("complementary", { name: "Panel de usuario" });
 const navigation = within(sidebar).getByRole("navigation", { name: "Secciones de mi cuenta" });
 const accountLink = within(navigation).getByRole("link", { name: "Cuenta" });
 expect(accountLink.getAttribute("href")).toBe(`${basePath}?section=cuenta`);
 expect(accountLink.getAttribute("aria-current")).toBe("page");
 expect(within(sidebar).queryByRole("link", { name: "Cambiar contraseña" })).toBeNull();
 const main = screen.getByRole("main");
 expect(within(main).getByRole("heading", { level: 1, name: "Cuenta" })).toBeTruthy();
 expect(within(main).getByRole("link", { name: "Cambiar contraseña" }).getAttribute("href")).toBe("/update-password");
 expect(screen.getAllByRole("link", { name: "Cambiar contraseña" })).toHaveLength(1);
 expect(within(main).queryByRole("button", { name: "Cerrar sesión" })).toBeNull();
 const logout = within(sidebar).getByRole("button", { name: "Cerrar sesión" });
 expect(screen.getAllByRole("button", { name: "Cerrar sesión" })).toHaveLength(1);
 fireEvent.submit(logout.closest("form")!);
 expect(logoutAction).toHaveBeenCalledOnce();
 expect(mocks.workspace).toHaveBeenCalledOnce();
 expect(mocks.policy).not.toHaveBeenCalled();
 expect(mocks.offers).not.toHaveBeenCalled();
 expect(mocks.participations).not.toHaveBeenCalled();
});
it("hides the closed participation section until a final state exists", async () => {
 accountSession();
 mocks.participations.mockResolvedValue([]);
 render(await AccountPage({ searchParams: Promise.resolve({ section: "dashboard" }) }));
 expect(screen.queryByRole("heading", { name: "Postulaciones cerradas" })).toBeNull();
 expect(screen.getByText(/No tenés postulaciones en curso/)).toBeTruthy();
});
it("only enables the email loop when the full address exceeds its visible width", async () => {
 const email = "persona.con.una.direccion.muy.larga@example.test";
 mocks.guard.mockResolvedValue({ account: { role: "candidate" }, user: { email } });
 const width = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(100);
 const textWidth = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(400);
 try {
  const view = render(await AccountPage({ searchParams: Promise.resolve({}) }));
  const address = screen.getByTitle(email);
  expect(address.getAttribute("data-overflow")).toBe("true");
  expect(address.querySelector('[aria-hidden="true"]')).toBeTruthy();
  expect(address.textContent).toBe(email + email);
  expect(address.tabIndex).toBe(0);
  textWidth.mockReturnValue(80);
  fireEvent(window, new Event("resize"));
  expect(address.getAttribute("data-overflow")).toBe("false");
  expect(address.textContent).toBe(email);
  expect(address.tabIndex).toBe(-1);
  view.unmount();
 } finally { width.mockRestore(); textWidth.mockRestore(); }
});
it("embeds offers with account-local profile and pagination destinations", async () => {
 accountSession(); mocks.workspace.mockResolvedValue(workspace("draft"));
 render(await AccountPage({ searchParams: Promise.resolve({ section: "ofertas", oferta: offer.id }) }));
 expect(screen.getByRole("heading", { level: 1, name: "Ofertas para postularme" })).toBeTruthy();
 expect(screen.getByRole("button", { name: "Postularme" })).toHaveProperty("disabled", true);
 expect(screen.getByRole("link", { name: "Revisar perfil" }).getAttribute("href")).toBe("/account?section=perfil");
 const next = new URL(screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")!, "https://example.test");
 expect(next.pathname).toBe("/account");
 expect(next.searchParams.get("section")).toBe("ofertas");
 expect(next.searchParams.get("page")).toBe("2");
 expect(next.searchParams.get("oferta")).toBe(offer.id);
 expect(mocks.workspace).toHaveBeenCalledOnce();
});
it("embeds participations and preserves withdrawal confirmation", async () => {
 accountSession();
 mocks.participations.mockResolvedValue([{ id: "received", opening_title: "Oferta recibida", display_status: "received", version: 2, created_at: "2026-10-07" }]);
 render(await AccountPage({ searchParams: Promise.resolve({ section: "postulaciones" }) }));
 expect(screen.getByRole("heading", { level: 1, name: "Mis postulaciones" })).toBeTruthy();
 expect(screen.getByRole("button", { name: "Retirar participación" })).toBeTruthy();
 expect(screen.getByRole("checkbox")).toHaveProperty("required", true);
 expect(screen.getByRole("link", { name: "Explorar ofertas" }).getAttribute("href")).toBe("/account?section=ofertas");
});
it("mantiene el bloqueo del perfil y evita duplicar una oferta seleccionada", async () => {
 mocks.workspace.mockResolvedValue(workspace("draft"));
 render(await OffersPage({ searchParams: Promise.resolve({ oferta: offer.slug }) }));
 expect(mocks.guard).toHaveBeenCalledOnce();
 expect(screen.getByRole("button", { name: "Postularme" })).toHaveProperty("disabled", true);
 expect(screen.getAllByRole("heading", { name: /Auxiliar administrativo/ })).toHaveLength(1);
 const next = new URL(screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")!, "https://example.test");
 expect(next.pathname).toBe("/dashboard");
 expect(next.searchParams.get("section")).toBe("ofertas");
 expect(next.searchParams.get("page")).toBe("2");
 expect(next.searchParams.get("oferta")).toBe(offer.slug);
});
it("enlaza por slug persistido y aplica con el UUID resuelto", async () => {
 render(await OffersPage({ searchParams: Promise.resolve({}) }));
 expect(screen.getByRole("link", { name: offer.title }).getAttribute("href")).toBe(`/ofertas/${offer.slug}`);
});
it("resuelve la selección por slug y conserva el UUID y la prevención de duplicados", async () => {
 mocks.participations.mockResolvedValue([{ opening_id: offer.id }]);
 const { container } = render(await OffersPage({ searchParams: Promise.resolve({ oferta: offer.slug }) }));
 expect(mocks.selected).toHaveBeenCalledExactlyOnceWith(offer.slug);
 expect(container.querySelector('input[name="openingId"]')).toHaveProperty("value", offer.id);
 expect(screen.getByRole("button", { name: "Participación registrada" })).toHaveProperty("disabled", true);
 expect(screen.getAllByRole("heading", { name: /Auxiliar administrativo/ })).toHaveLength(1);
});
it("no habilita otra postulación para una oferta ya registrada", async () => {
 mocks.participations.mockResolvedValue([{ opening_id: offer.id }]);
 render(await OffersPage({ searchParams: Promise.resolve({}) }));
 expect(screen.getByRole("button", { name: "Participación registrada" })).toHaveProperty("disabled", true);
});
it("conserva el aviso cuando la oferta seleccionada dejó de estar disponible", async () => {
 mocks.selected.mockRejectedValue(new AppError("NOT_FOUND"));
 render(await OffersPage({ searchParams: Promise.resolve({ oferta: offer.slug }) }));
 expect(screen.getByText("La oferta elegida ya no está disponible para postularse.")).toBeTruthy();
});
it("solo permite retirar participaciones recibidas y exige confirmación", async () => {
 mocks.participations.mockResolvedValue([{ id: "recibida", opening_title: "Oferta recibida", display_status: "received", version: 2, created_at: "2026-10-07" }, { id: "final", opening_title: "Oferta final", display_status: "hired", version: 3, created_at: "2026-10-07" }]);
 render(await ParticipationsPage());
 expect(screen.getAllByRole("button", { name: "Retirar participación" })).toHaveLength(1);
 expect(screen.getByRole("checkbox")).toHaveProperty("required", true);
 expect(within(screen.getByText("Oferta final").closest("li")!).queryByRole("button")).toBeNull();
});
it("keeps assisted profile linking warnings inside the profile canvas", async () => {
 mocks.workspace.mockResolvedValue({ bootstrap: "pending_in_person_claim", profile: null });
 render(await ProfilePage({ searchParams: Promise.resolve({}) }));
 expect(screen.getByRole("main").childElementCount).toBe(1);
 expect(screen.getByRole("main").querySelector('[data-slot="profile-canvas"]')?.contains(screen.getByRole("alert"))).toBe(true);
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

vi.mock("@/lib/records/references", async () => (await import("../../fixtures/record-references")).referenceMocks);
vi.mock("@/lib/records/page-references", async () => (await import("../../fixtures/record-references")).pageReferenceMocks);
vi.mock("@/lib/records/reference-url", async () => ({ referenceUrl: async (href: string) => (await import("../../fixtures/record-references")).fixtureHref(href) }));
vi.mock("@/components/ui/record-link", async () => (await import("../../fixtures/record-references")).recordLinkMocks);
