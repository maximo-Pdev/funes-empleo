import { beforeEach, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { openingPreview } from "../../fixtures/opening-preview";
const { service, preview, nominate, refresh, push } = vi.hoisted(() => ({ service: vi.fn(), preview: vi.fn(), nominate: vi.fn(), refresh: vi.fn(), push: vi.fn() }));
vi.mock("@/features/candidates/matching-service", () => ({ getOpeningMatches: service }));
vi.mock("@/features/candidates/matching-actions", () => ({ openingCandidatePreviewAction: preview }));
vi.mock("@/features/participations/nomination-actions", () => ({ createAdminNominationAction: nominate }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push }) }));
import { OpeningCandidateMatches, OpeningCandidateMatchesList } from "@/features/participations/components/opening-candidate-matches";
import type { OpeningMatches } from "@/validation/opening-matching";

const id = "00000000-0000-4000-8000-000000000001";
const matches: OpeningMatches = { available: true, total: 42, page: 2, pageSize: 20,
  items: [{ id, displayName: "Persona ficticia", locality: "Funes", participationId: null,
    matchedCategories: [{ code: "COMERCIO", name: "Comercio" }, { code: "ADMINISTRACION", name: "Administración" }] }] };

beforeEach(() => {
  vi.resetAllMocks();
  preview.mockResolvedValue({ code: "OK", profile: { ...openingPreview, cvReference: "cv-111111111111111111111111" } });
  nominate.mockResolvedValue({ code: "OK", participationId: id });
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true,
    value: function(this: HTMLDialogElement) { this.setAttribute("open", ""); this.querySelector("button")?.focus(); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true,
    value: function(this: HTMLDialogElement) { this.removeAttribute("open"); } });
});

it("explica OR e intermediación, muestra rubros y no ofrece derivación automática", () => {
  render(<OpeningCandidateMatchesList openingId={id} openingReference="ofe-111111111111111111111111" matches={matches} />);
  expect(screen.getByText(/comparten al menos un rubro/)).toBeTruthy();
  expect(screen.getByText("Rubros coincidentes: Comercio, Administración")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Ver perfil de Persona ficticia" })).toBeTruthy();
  expect(nominate).not.toHaveBeenCalled();
  expect(screen.getByText("Coincidencias: 42")).toBeTruthy();
  expect(screen.getAllByRole("list").some(list => list.className.includes("md:grid-cols-2"))).toBe(true);
});

it("pagina conservando contexto de oferta y ancla accesible", () => {
  render(<OpeningCandidateMatchesList openingId={id} openingReference="ofe-111111111111111111111111" matches={matches} order="updated_asc" />);
  expect(screen.getByRole("navigation", { name: "Páginas de coincidencias" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Anterior" }).getAttribute("href")).toBe(`/admin/openings/ofe-111111111111111111111111?matchOrder=updated_asc#opening-matches`);
  expect(screen.getByRole("link", { name: "Siguiente" }).getAttribute("href")).toBe(`/admin/openings/ofe-111111111111111111111111?matchOrder=updated_asc&matchPage=3#opening-matches`);
});

it("ordena por actualización y reinicia a página uno sin perder la oferta", () => {
  render(<OpeningCandidateMatchesList openingId={id} openingReference="ofe-111111111111111111111111" matches={matches} />);
  const select = screen.getByRole("combobox", { name: "Última actualización del perfil" });
  expect(select).toHaveProperty("value", "updated_desc");
  expect(screen.getAllByRole("option")).toHaveLength(2);
  fireEvent.change(select, { target: { value: "updated_asc" } });
  expect(push).toHaveBeenCalledWith("/admin/openings/ofe-111111111111111111111111?matchOrder=updated_asc#opening-matches", { scroll: false });
  expect(nominate).not.toHaveBeenCalled();
});

it("no muestra una participación existente aunque llegue una respuesta anterior", () => {
  render(<OpeningCandidateMatchesList openingId={id} openingReference="ofe-111111111111111111111111" matches={{ ...matches,
    items: [{ ...matches.items[0]!, participationId: id }] }} />);
  expect(screen.queryByRole("button", { name: "Ver perfil de Persona ficticia" })).toBeNull();
});

it("muestra vacío y recuperación de página fuera de rango", () => {
  render(<OpeningCandidateMatchesList openingId={id} openingReference="ofe-111111111111111111111111" matches={{ ...matches, items: [], page: 9 }} />);
  expect(screen.getByText("Sin candidatos en esta página")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Volver a la primera página" }).getAttribute("href")).toBe(`/admin/openings/ofe-111111111111111111111111?matchOrder=updated_desc#opening-matches`);
});

it("no muestra candidatos cuando la oferta no habilita matching", () => {
  render(<OpeningCandidateMatchesList openingId={id} openingReference="ofe-111111111111111111111111" matches={{ ...matches, available: false, items: [], total: 0 }} />);
  expect(screen.getByText("Coincidencias no disponibles")).toBeTruthy();
  expect(screen.getByRole("combobox")).toHaveProperty("disabled", true);
  expect(screen.queryByRole("navigation")).toBeNull();
});

it("rechaza arrays sin convertirlos en una página válida", async () => {
  render(await OpeningCandidateMatches({ openingId: id, page: ["1", "2"] }));
  expect(screen.getByRole("alert").textContent).toContain("Revisá la página");
  expect(service).not.toHaveBeenCalled();
});

it("resuelve componente servidor y pagina en el servicio real por contrato", async () => {
  service.mockResolvedValue(matches);
  render(await OpeningCandidateMatches({ openingId: id, page: "2" }));
  expect(service).toHaveBeenCalledWith({ openingId: id, page: 2, pageSize: 12, order: "updated_desc" });
  expect(screen.getByText("Persona ficticia")).toBeTruthy();
});

it("abre bajo demanda, muestra perfil laboral y cierra devolviendo foco", async () => {
  render(<OpeningCandidateMatchesList openingId={id} openingReference="ofe-111111111111111111111111" matches={matches} />);
  expect(preview).not.toHaveBeenCalled();
  const button = screen.getByRole("button", { name: "Ver perfil de Persona ficticia" });
  fireEvent.click(button);
  expect(await screen.findByText("Experiencia laboral ficticia")).toBeTruthy();
  expect(preview).toHaveBeenCalledWith({ openingId: id, candidateId: id });
  expect(screen.getByText("Oferta ficticia actual")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Abrir CV PDF en otra pestaña" }).getAttribute("href")).toBe("/api/cv/cv-111111111111111111111111");
  fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(button));
  expect(nominate).not.toHaveBeenCalled();
});

it("nomina exactamente a esta oferta con las versiones del preview y retira la ficha", async () => {
  render(<OpeningCandidateMatchesList openingId={id} openingReference="ofe-111111111111111111111111" matches={matches} />);
  fireEvent.click(screen.getByRole("button", { name: "Ver perfil de Persona ficticia" }));
  fireEvent.click(await screen.findByRole("button", { name: "Nominar a esta oferta" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(nominate).toHaveBeenCalledWith({ candidateId: id, candidateVersion: 7, openingId: id, openingVersion: 3 });
  expect(screen.queryByRole("button", { name: "Ver perfil de Persona ficticia" })).toBeNull();
  expect(screen.getByText("Coincidencias: 41")).toBeTruthy();
  expect(screen.getByRole("status").textContent).toContain("La empresa todavía no recibe su perfil");
  expect(refresh).toHaveBeenCalledOnce();
});

it("conserva ficha y diálogo si hay conflicto de versión", async () => {
  nominate.mockResolvedValue({ code: "CONFLICT_STALE_DATA" });
  render(<OpeningCandidateMatchesList openingId={id} openingReference="ofe-111111111111111111111111" matches={matches} />);
  fireEvent.click(screen.getByRole("button", { name: "Ver perfil de Persona ficticia" }));
  fireEvent.click(await screen.findByRole("button", { name: "Nominar a esta oferta" }));
  expect((await screen.findByRole("alert")).textContent).toContain("El registro cambió");
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.getByText("Coincidencias: 42")).toBeTruthy();
});

it("ignora una respuesta tardía después de cerrar el popup", async () => {
  let resolvePreview!: (value: { code: "OK"; profile: typeof openingPreview }) => void;
  preview.mockReturnValue(new Promise(resolve => { resolvePreview = resolve; }));
  render(<OpeningCandidateMatchesList openingId={id} openingReference="ofe-111111111111111111111111" matches={matches} />);
  fireEvent.click(screen.getByRole("button", { name: "Ver perfil de Persona ficticia" }));
  expect(screen.getByRole("status").textContent).toBe("Cargando perfil…");
  fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
  await act(async () => resolvePreview({ code: "OK", profile: openingPreview }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.queryByText("Experiencia laboral ficticia")).toBeNull();
});

it("permite cerrar con Escape mediante cancel y devuelve el foco", async () => {
  render(<OpeningCandidateMatchesList openingId={id} openingReference="ofe-111111111111111111111111" matches={matches} />);
  const button = screen.getByRole("button", { name: "Ver perfil de Persona ficticia" });
  fireEvent.click(button);
  await screen.findByRole("button", { name: "Nominar a esta oferta" });
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: false, cancelable: true }));
  await waitFor(() => expect(document.activeElement).toBe(button));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("muestra error seguro y permite recargar sin nominar", async () => {
  preview.mockResolvedValueOnce({ code: "NOT_FOUND", profile: null });
  render(<OpeningCandidateMatchesList openingId={id} openingReference="ofe-111111111111111111111111" matches={matches} />);
  fireEvent.click(screen.getByRole("button", { name: "Ver perfil de Persona ficticia" }));
  expect((await screen.findByRole("alert")).textContent).toContain("No encontramos el recurso");
  expect(screen.queryByRole("button", { name: "Nominar a esta oferta" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Volver a cargar perfil" }));
  await screen.findByRole("button", { name: "Nominar a esta oferta" });
  expect(nominate).not.toHaveBeenCalled();
});

it("bloquea doble envío y cierre mientras confirma", async () => {
  let resolveNomination!: (value: { code: "OK"; participationId: string }) => void;
  nominate.mockReturnValue(new Promise(resolve => { resolveNomination = resolve; }));
  render(<OpeningCandidateMatchesList openingId={id} openingReference="ofe-111111111111111111111111" matches={matches} />);
  fireEvent.click(screen.getByRole("button", { name: "Ver perfil de Persona ficticia" }));
  const button = await screen.findByRole("button", { name: "Nominar a esta oferta" });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(nominate).toHaveBeenCalledOnce();
  expect(button).toHaveProperty("disabled", true);
  expect(screen.getByRole("button", { name: "Cerrar" })).toHaveProperty("disabled", true);
  await act(async () => resolveNomination({ code: "OK", participationId: id }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("presenta error seguro sin mostrar el error interno", async () => {
  service.mockRejectedValue(new Error("Detalle SQL ficticio privado"));
  render(await OpeningCandidateMatches({ openingId: id }));
  expect(screen.getByRole("alert").textContent).toContain("No pudimos cargar");
  expect(screen.queryByText(/Detalle SQL/)).toBeNull();
});

vi.mock("@/lib/records/references", async () => (await import("../../fixtures/record-references")).referenceMocks);
