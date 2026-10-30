import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), calls: [] as string[], filters: [] as unknown[][], result: { data: [] as never[] | null, count: 0 as number | null, error: null as { code: string; message: string } | null }, tally: { data: null, count: 25 as number | null, error: null as { code: string; message: string } | null } }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
import { listAdminOpenings } from "@/features/openings/admin-service";

beforeEach(() => {
  mocks.calls.length = 0; mocks.filters.length = 0; mocks.result = { data: [], count: 0, error: null }; mocks.tally = { data: null, count: 25, error: null }; let head = false;
  const query = {
    select: (_columns: string, options?: { head?: boolean }) => { head = options?.head ?? false; mocks.calls.push("select"); return query; },
    is: () => query,
    neq: (...args: unknown[]) => { mocks.calls.push("excludeDraft"); mocks.filters.push(args); return query; },
    eq: (...args: unknown[]) => { mocks.filters.push(args); return query; },
    order: () => query,
    range: () => { mocks.calls.push("paginate"); return query; },
    then: (resolve: (result: typeof mocks.result) => unknown) =>
      Promise.resolve(head ? mocks.tally : mocks.result).then(resolve),
  };
  mocks.session.mockResolvedValue({ account: { role: "admin", status: "active" }, client: { from: () => query } });
});
it("excluye borradores antes del conteo/paginación y conserva filtros válidos", async () => {
  expect(await listAdminOpenings({ status: "published", page: 2 })).toMatchObject({ total: 0, page: 2 });
  expect(mocks.filters).toEqual([["status", "draft"], ["status", "published"]]);
  expect(mocks.calls).toEqual(["select", "excludeDraft", "paginate"]);
});
it("no acepta borrador como filtro ni consultas desde otro rol", async () => {
  await expect(listAdminOpenings({ status: "draft" })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  mocks.session.mockResolvedValue({ account: { role: "company", status: "active" } });
  await expect(listAdminOpenings({})).rejects.toMatchObject({ code: "ACCESS_DENIED" });
});
it("recupera exclusivamente un rango vacío con conteo bajo los mismos filtros", async () => {
  mocks.result = { data: null, count: null, error: { code: "PGRST103", message: "Requested range not satisfiable" } };
  expect(await listAdminOpenings({ status: "published", page: 99, pageSize: 10 })).toEqual({ items: [], total: 25, page: 99, pageSize: 10, pageCount: 3 });
  expect(mocks.filters).toEqual([["status", "draft"], ["status", "published"], ["status", "draft"], ["status", "published"]]);
  expect(mocks.calls).toEqual(["select", "excludeDraft", "paginate", "select", "excludeDraft"]);
});
it("no oculta errores diferentes del rango ni errores del conteo", async () => {
  mocks.result = { data: null, count: null, error: { code: "42501", message: "Denied" } };
  await expect(listAdminOpenings({ page: 2 })).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  expect(mocks.calls.filter(call => call === "select")).toHaveLength(1);
  mocks.result.error = { code: "PGRST103", message: "Range" };
  mocks.tally.error = { code: "42501", message: "Denied" };
  await expect(listAdminOpenings({ page: 2 })).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});
