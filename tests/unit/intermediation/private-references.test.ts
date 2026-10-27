import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), redirect: vi.fn(), notFound: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));
import { recordIdentifier, recordReference, recordReferences, routeIdentifier } from "@/lib/records/references";
import { referenceUrl, canonicalReferenceRoute } from "@/lib/records/reference-url";
import { pageRecordIdentifier, referenceFilters } from "@/lib/records/page-references";
import { isRecordReference, REFERENCE_PREFIXES } from "@/lib/records/reference-format";

const id = "0a000000-0000-4000-8000-000000000001";
const other = "0a000000-0000-4000-8000-000000000002";
const reference = "can-0123456789abcdef01234567";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ account: { status: "active" }, client: { rpc: mocks.rpc } });
  mocks.rpc.mockResolvedValue({ data: { [id]: reference }, error: null });
  mocks.notFound.mockImplementation(() => { throw new Error("NOT_FOUND_PAGE"); });
});

it.each(Object.entries(REFERENCE_PREFIXES))("valida el prefijo de %s sin aceptar UUID reformateado", (kind, prefix) => {
  expect(isRecordReference(kind as keyof typeof REFERENCE_PREFIXES, `${prefix}-0123456789abcdef01234567`)).toBe(true);
  expect(isRecordReference(kind as keyof typeof REFERENCE_PREFIXES, id)).toBe(false);
  expect(isRecordReference(kind as keyof typeof REFERENCE_PREFIXES, `${prefix}-${id.replaceAll("-", "")}`)).toBe(false);
  expect(isRecordReference(kind as keyof typeof REFERENCE_PREFIXES, `${prefix}-../archivo`)).toBe(false);
});
it("deduplica IDs y no transforma los contratos UUID de RPC", async () => {
  expect(await recordReferences("candidate", [id, id, null, undefined])).toEqual({ [id]: reference });
  expect(mocks.rpc).toHaveBeenCalledWith("get_record_references", { p_kind: "candidate", p_ids: [id] });
  expect(await recordReferences("candidate", [])).toEqual({});
});
it("divide listas extensas en lotes acotados sin perder registros", async () => {
  const ids = Array.from({ length: 1001 }, (_, index) => `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`);
  mocks.rpc.mockImplementation(async (_name, args) => ({ data: Object.fromEntries(args.p_ids.map((value: string) => [value, reference])), error: null }));
  expect(Object.keys(await recordReferences("candidate", ids))).toHaveLength(1001);
  expect(mocks.rpc.mock.calls.map(call => call[1].p_ids.length)).toEqual([1000, 1]);
});
it.each([null, [], "dato", { [id]: "emp-0123456789abcdef01234567" }, { [other]: reference }])("rechaza respuesta inesperada sin fallback UUID: %j", async data => {
  mocks.rpc.mockResolvedValue({ data, error: null });
  await expect(recordReferences("candidate", [id])).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});
it("un registro no autorizado nunca se convierte en enlace", async () => {
  mocks.rpc.mockResolvedValue({ data: {}, error: null });
  await expect(recordReference("candidate", id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(routeIdentifier("candidate", id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  expect(mocks.redirect).not.toHaveBeenCalled();
});
it("acepta UUID legados con mayúsculas sin exponerlos ni cambiar el código", async () => {
  expect(await routeIdentifier("candidate", id.toUpperCase())).toBe(id);
  expect(await referenceUrl(`/admin/candidates/${id.toUpperCase()}`)).toBe(`/admin/candidates/${reference}`);
});
it("conserva categorías opacas en filtros del apartado presencial", async () => {
  const category = "rub-0123456789abcdef01234567";
  mocks.rpc.mockResolvedValue({ data: { [id]: category }, error: null });
  expect(await referenceUrl(`/admin/atencion-presencial?categoryId=${id}&page=2`)).toBe(`/admin/atencion-presencial?categoryId=${category}&page=2`);
  expect(mocks.rpc).toHaveBeenCalledWith("get_record_references", { p_kind: "category", p_ids: [id] });
});
it.each(["csv", "pdf", "xlsx"])("canonicaliza el filtro de categoría del informe %s", async extension => {
  const category = "rub-0123456789abcdef01234567";
  mocks.rpc.mockResolvedValue({ data: { [id]: category }, error: null });
  expect(await referenceUrl(`/api/admin/exports/operations.${extension}?from=2026-09-01&category=${id}`))
    .toBe(`/api/admin/exports/operations.${extension}?from=2026-09-01&category=${category}`);
  expect(mocks.rpc).toHaveBeenCalledWith("get_record_references", { p_kind: "category", p_ids: [id] });
});
it.each([null, { account: { status: "suspended" } }])("no consulta referencias sin sesión activa: %j", async session => {
  mocks.session.mockResolvedValue(session);
  await expect(recordReferences("candidate", [id])).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
  await expect(recordIdentifier("candidate", reference)).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("resuelve códigos solo mediante el RPC autorizado y rechaza el tipo equivocado", async () => {
  mocks.rpc.mockResolvedValue({ data: id, error: null });
  expect(await recordIdentifier("candidate", reference)).toBe(id);
  expect(mocks.rpc).toHaveBeenCalledWith("resolve_record_reference", { p_kind: "candidate", p_reference: reference });
  await expect(recordIdentifier("company", reference)).rejects.toMatchObject({ code: "NOT_FOUND" });
});
it.each([null, "no-uuid"])("ajeno e inexistente fallan igual: %j", async data => {
  mocks.rpc.mockResolvedValue({ data, error: null });
  await expect(recordIdentifier("candidate", reference)).rejects.toMatchObject({ code: "NOT_FOUND" });
});
it("canonicaliza rutas antiguas autorizadas conservando query y ancla", async () => {
  expect(await referenceUrl(`/admin/candidates/${id}?cv=ok#historial`)).toBe(`/admin/candidates/${reference}?cv=ok#historial`);
  await canonicalReferenceRoute(`/admin/candidates/${id}`, { cv: "ok", repeated: ["uno", "dos"] });
  expect(mocks.redirect).toHaveBeenCalledWith(`/admin/candidates/${reference}?cv=ok&repeated=uno&repeated=dos`);
});
it("no cambia slugs públicos, URL externas, hashes ni tokens de Auth", async () => {
  for (const href of ["/ofertas/auxiliar-administrativo-abc123", `https://other.invalid/${id}`, `//other.invalid/${id}`, `/auth/callback?code=${id}`]) {
    expect(await referenceUrl(href)).toBe(href);
  }
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it("canonicaliza la oferta y el selector de derivación en la página empresarial integrada", async () => {
  mocks.rpc.mockImplementation(async (_name, args) => ({ data: {
    [id]: args.p_kind === "opening" ? "ofe-0123456789abcdef01234567" : "der-0123456789abcdef01234567",
  }, error: null }));
  expect(await referenceUrl(`/empresa/ofertas/${id}?referral=${id}#derivaciones`))
    .toBe("/empresa/ofertas/ofe-0123456789abcdef01234567?referral=der-0123456789abcdef01234567#derivaciones");
});
it("rechaza un detalle ajeno con 404, sin canonicalizar ni revelar su código", async () => {
  mocks.rpc.mockResolvedValue({ data: {}, error: null });
  await expect(pageRecordIdentifier("candidate", id, `/admin/candidates/${id}`)).rejects.toThrow("NOT_FOUND_PAGE");
  expect(mocks.redirect).not.toHaveBeenCalled();
});
it("resuelve filtros a UUID internos sin reescribir entradas inválidas como válidas", async () => {
  mocks.rpc.mockResolvedValue({ data: id, error: null });
  expect(await referenceFilters("/admin/participations", { candidateId: reference, status: "hired" }, { candidateId: "candidate" })).toEqual({ candidateId: id, status: "hired" });
  expect(await referenceFilters("/admin/participations", { candidateId: "desconocido" }, { candidateId: "candidate" })).toEqual({ candidateId: "invalid-reference" });
});
