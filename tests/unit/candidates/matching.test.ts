import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { session, rpc } = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: session }));
import { getOpeningMatches, getOpeningCandidatePreview } from "@/features/candidates/matching-service";
import { openingPreview } from "../../fixtures/opening-preview";
import { openingMatchingInput } from "@/validation/opening-matching";

const id = "00000000-0000-4000-8000-000000000001";
const response = { available: true, total: 1, page: 2, pageSize: 10,
  items: [{ id, displayName: "Persona ficticia", locality: null, participationId: null,
    matchedCategories: [{ code: "COMERCIO", name: "Comercio" }] }] };

beforeEach(() => {
  vi.resetAllMocks();
  session.mockResolvedValue({ account: { role: "admin", status: "active" }, client: { rpc } });
  rpc.mockResolvedValue({ data: response, error: null });
});

it("normaliza páginas y transporta únicamente los parámetros admitidos", async () => {
  expect(await getOpeningMatches({ openingId: id, page: "2", pageSize: "10", role: "company" })).toEqual(response);
  expect(rpc).toHaveBeenCalledWith("match_opening_candidates", { p_opening: id, p_page: 2, p_page_size: 10 });
});

it("usa valores predeterminados acotados", async () => {
  await getOpeningMatches({ openingId: id });
  expect(rpc).toHaveBeenCalledWith("match_opening_candidates", { p_opening: id, p_page: 1, p_page_size: 20 });
});

it.each([null, { role: "company", status: "active" }, { role: "candidate", status: "active" },
  { role: "admin", status: "suspended" }, { role: "admin", status: "archived" }])("deniega actor %j antes de consultar", async account => {
  session.mockResolvedValue(account && { account, client: { rpc } });
  await expect(getOpeningMatches({ openingId: id })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
  expect(rpc).not.toHaveBeenCalled();
});

it.each([{ openingId: "inválido" }, { openingId: id, page: ["1", "2"] }, { openingId: id, page: true },
  { openingId: id, page: "" }, { openingId: id, page: null }, { openingId: id, page: 0 },
  { openingId: id, page: 1.5 }, { openingId: id, page: 10001 }, { openingId: id, pageSize: 51 }])("rechaza entrada %j", async input => {
  expect(openingMatchingInput.safeParse(input).success).toBe(false);
  await expect(getOpeningMatches(input)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  expect(session).not.toHaveBeenCalled();
});

it.each([["AUTH_REQUIRED", "AUTH_REQUIRED"], ["FORBIDDEN", "ACCESS_DENIED"], ["NOT_FOUND", "NOT_FOUND"],
  ["INVALID_INPUT", "VALIDATION_ERROR"], ["SQL privado ficticio", "INTERNAL_ERROR"]])("traduce error %s sin filtrar SQL", async (message, code) => {
  rpc.mockResolvedValue({ data: null, error: { message } });
  await expect(getOpeningMatches({ openingId: id })).rejects.toMatchObject({ code, message: code });
});

it.each([null, {}, { ...response, total: -1 }, { ...response, items: [{ ...response.items[0], id: "no-id" }] },
  { ...response, items: [{ ...response.items[0], matchedCategories: [] }] }])("rechaza contrato SQL inválido %j", async data => {
  rpc.mockResolvedValue({ data, error: null });
  await expect(getOpeningMatches({ openingId: id })).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});

it("acepta resultado vacío e indisponibilidad sin convertirlos en candidatos", async () => {
  const unavailable = { available: false, total: 0, page: 1, pageSize: 20, items: [] };
  rpc.mockResolvedValue({ data: unavailable, error: null });
  expect(await getOpeningMatches({ openingId: id })).toEqual(unavailable);
});

it("carga el perfil de la pareja candidata/oferta y elimina campos ajenos al contrato", async () => {
  rpc.mockResolvedValue({ data: { ...openingPreview, dni: "ficticio-no-transmitir", notes: "no transmitir" }, error: null });
  expect(await getOpeningCandidatePreview({ openingId: id, candidateId: id })).toEqual(openingPreview);
  expect(rpc).toHaveBeenCalledWith("preview_opening_candidate", { p_opening: id, p_candidate: id });
});

it.each(["interest", "occupation"])("preview lee categorías históricas %s sin transmitir su clasificación", async kind => {
  const categories = openingPreview.categories.map(category => ({ ...category, kind }));
  rpc.mockResolvedValue({ data: { ...openingPreview, categories }, error: null });
  const profile = await getOpeningCandidatePreview({ openingId: id, candidateId: id });
  expect(profile.categories).toEqual(categories.map(({ code, name }) => ({ code, name })));
});

it("preview conserva categorías mixtas sin intereses ni datos privados", async () => {
  const categories = [
    { code: "COMERCIO", name: "Comercio", kind: "occupation" },
    { code: "TECNOLOGIA", name: "Tecnología", kind: "interest", privateNote: "no transmitir" },
  ];
  rpc.mockResolvedValue({ data: { ...openingPreview, categories, contacts: ["privado"], dni: "privado" }, error: null });
  const profile = await getOpeningCandidatePreview({ openingId: id, candidateId: id });
  expect(profile).toEqual({ ...openingPreview, categories: categories.map(({ code, name }) => ({ code, name })) });
});

it.each([[{ name: "Falta código", kind: "interest" }], [{ code: "COMERCIO", name: null, kind: "occupation" }]])(
  "preview sigue rechazando categorías malformadas %j", async categories => {
    rpc.mockResolvedValue({ data: { ...openingPreview, categories }, error: null });
    await expect(getOpeningCandidatePreview({ openingId: id, candidateId: id })).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  },
);

it.each([null, { role: "company", status: "active" }, { role: "candidate", status: "active" },
  { role: "admin", status: "suspended" }])("preview deniega actor %j", async account => {
  session.mockResolvedValue(account && { account, client: { rpc } });
  await expect(getOpeningCandidatePreview({ openingId: id, candidateId: id })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
  expect(rpc).not.toHaveBeenCalled();
});

it.each([{ openingId: id }, { candidateId: id }, { openingId: id, candidateId: [id] }])("preview rechaza entrada %j", async input => {
  await expect(getOpeningCandidatePreview(input)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  expect(session).not.toHaveBeenCalled();
});

it.each([null, { ...openingPreview, candidateVersion: 0 },
  { ...openingPreview, id: "00000000-0000-4000-8000-000000000002" },
  { ...openingPreview, openingId: "00000000-0000-4000-8000-000000000002" }])("preview rechaza respuesta inválida/cruzada %j", async data => {
  rpc.mockResolvedValue({ data, error: null });
  await expect(getOpeningCandidatePreview({ openingId: id, candidateId: id })).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});

it("preview traduce inaccesibilidad sin exponer el error SQL", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "NOT_FOUND" } });
  await expect(getOpeningCandidatePreview({ openingId: id, candidateId: id })).rejects.toMatchObject({ code: "NOT_FOUND" });
});
