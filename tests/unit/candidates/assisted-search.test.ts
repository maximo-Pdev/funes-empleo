import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), from: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
import * as service from "@/features/candidates/search-service";

const current = new Date("2026-10-23T12:00:00Z");
const rows = [
  { id: "self", origin: "self_service", status: "active" },
  { id: "draft", origin: "assisted", status: "draft" },
  { id: "imported", origin: "imported", status: "active" },
  { id: "linked", origin: "assisted", status: "needs_update", account_id: "linked-account" },
  { id: "archived", origin: "assisted", status: "archived" },
].map(row => ({ display_name: row.id, account_id: null, accounts: { status: "active" },
  availability: "available", refresh_due_at: "2027-10-01", archived_at: row.status === "archived" ? "2026-10-01" : null,
  locality: "Funes", skills_experience_summary: null, version: 1, candidate_categories: [],
  candidate_consents: [{ id: "consent", status: "accepted", recorded_at: "2026-10-01" }],
  cv_documents: [{ status: "valid", archived_at: null, opening_id: null }], ...row }));
const filters = new Map<string, unknown>();
const query = { eq: vi.fn(), is: vi.fn(), gt: vi.fn(), order: vi.fn(), range: vi.fn(),
  then: (resolve: (value: unknown) => unknown) => resolve({ data: rows.filter(row =>
    (!filters.has("origin") || row.origin === filters.get("origin")) &&
    (!filters.has("status") || row.status === filters.get("status")) &&
    (!filters.has("archived_at") || row.archived_at === null)), error: null }) };

beforeEach(() => {
  vi.clearAllMocks(); filters.clear();
  query.eq.mockImplementation((key: string, value: unknown) => { filters.set(key, value); return query; });
  query.is.mockImplementation((key: string, value: unknown) => { filters.set(key, value); return query; });
  for (const method of [query.gt, query.order, query.range]) method.mockReturnValue(query);
  mocks.from.mockReturnValue({ select: vi.fn(() => query) });
  mocks.rpc.mockResolvedValue({ data: 0, error: null });
  mocks.session.mockResolvedValue({ account: { role: "admin", status: "active" }, client: { from: mocks.from, rpc: mocks.rpc } });
});

it("fija origen asistido antes del total/paginación e incluye borrador y vinculado", async () => {
  const result = await service.searchAssistedCandidates({ eligibility: "all", page: 2, pageSize: 1 }, current);
  expect(query.eq).toHaveBeenCalledWith("origin", "assisted");
  expect(query.eq).not.toHaveBeenCalledWith("status", "active");
  expect(result).toMatchObject({ total: 2, page: 2, pageCount: 2 });
  expect(result.items.map(item => item.id)).toEqual(["linked"]);
});
it("el cliente no puede cambiar el origen del listado", async () => {
  const result = await service.searchAssistedCandidates({ origin: "self_service", eligibility: "all" }, current);
  expect(result.items.map(item => item.id)).toEqual(["draft", "linked"]);
});
it("conserva defaults y ámbito de la búsqueda general", async () => {
  const result = await service.searchCandidates({}, current);
  expect(query.eq).not.toHaveBeenCalledWith("origin", expect.anything());
  expect(query.eq).toHaveBeenCalledWith("status", "active");
  expect(result.items.map(item => item.id)).toEqual(["self", "imported"]);
});
it.each([null, { role: "candidate", status: "active" }, { role: "company", status: "active" }, { role: "admin", status: "suspended" }])("exige administrador activo antes de consultar: %j", async account => {
  mocks.session.mockResolvedValue(account ? { account, client: { from: mocks.from, rpc: mocks.rpc } } : null);
  await expect(service.searchAssistedCandidates({}, current)).rejects.toMatchObject({ code: "ACCESS_DENIED" });
  expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
});
