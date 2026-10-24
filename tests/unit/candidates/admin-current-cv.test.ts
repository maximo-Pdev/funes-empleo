import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), from: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
import { getAdminCandidate } from "@/features/candidates/search-service";

const id = "0a000000-0000-4000-8000-000000000001";
const cv = { id, original_name_safe: "cv-ficticio.pdf", byte_size: 2048 };
const results = new Map<string, { data: unknown; error: unknown }>();
function query(table: string) {
  const builder = { select: vi.fn(), eq: vi.fn(), is: vi.fn(), in: vi.fn(), or: vi.fn(), order: vi.fn(), maybeSingle: vi.fn(), limit: vi.fn() };
  for (const method of [builder.select, builder.eq, builder.is, builder.in, builder.or, builder.order]) method.mockReturnValue(builder);
  builder.maybeSingle.mockImplementation(async () => results.get(table));
  builder.limit.mockImplementation(async () => results.get(table));
  return builder;
}
const queries = new Map<string, ReturnType<typeof query>>();
beforeEach(() => {
  vi.clearAllMocks(); results.clear(); queries.clear();
  results.set("candidate_profiles", { data: { id, account_id: null, status: "active", availability: "available", refresh_due_at: "2027-10-01", candidate_consents: [], cv_documents: [], candidate_categories: [] }, error: null });
  for (const table of ["participations", "internal_notes", "audit_events"]) results.set(table, { data: [], error: null });
  results.set("cv_documents", { data: cv, error: null });
  mocks.rpc.mockResolvedValue({ error: null });
  mocks.from.mockImplementation((table: string) => { const builder = query(table); queries.set(table, builder); return builder; });
  mocks.session.mockResolvedValue({ account: { role: "admin", status: "active" }, client: { from: mocks.from, rpc: mocks.rpc } });
});

it("consulta únicamente el CV válido no archivado del candidato con metadatos mínimos", async () => {
  expect((await getAdminCandidate(id)).currentCv).toEqual(cv);
  const builder = queries.get("cv_documents")!;
  expect(builder.select).toHaveBeenCalledWith("id,original_name_safe,byte_size");
  expect(builder.eq).toHaveBeenCalledWith("candidate_id", id);
  expect(builder.eq).toHaveBeenCalledWith("status", "valid");
  expect(builder.is).toHaveBeenCalledWith("archived_at", null);
  expect(builder.maybeSingle).toHaveBeenCalledOnce();
});
it("devuelve ausencia si no hay CV vigente, sin buscar una versión histórica", async () => {
  results.set("cv_documents", { data: null, error: null });
  expect((await getAdminCandidate(id)).currentCv).toBeNull();
});
it("un error de lectura no se confunde con ausencia de CV", async () => {
  results.set("cv_documents", { data: null, error: { message: "Error privado no publicable" } });
  await expect(getAdminCandidate(id)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});
it.each([null, { role: "candidate", status: "active" }, { role: "company", status: "active" }, { role: "admin", status: "suspended" }])("deniega la lectura sin administrador activo: %j", async account => {
  mocks.session.mockResolvedValue(account ? { account, client: { from: mocks.from, rpc: mocks.rpc } } : null);
  await expect(getAdminCandidate(id)).rejects.toMatchObject({ code: "ACCESS_DENIED" });
  expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
});
it("rechaza identificadores inválidos antes de acceder a datos", async () => {
  await expect(getAdminCandidate("invalid")).rejects.toMatchObject({ code: "NOT_FOUND" });
  expect(mocks.from).not.toHaveBeenCalled();
});
