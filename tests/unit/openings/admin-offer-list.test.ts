import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), calls: [] as string[], filters: [] as unknown[][] }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
import { listAdminOpenings } from "@/features/openings/admin-service";

beforeEach(() => {
  mocks.calls.length = 0; mocks.filters.length = 0;
  const query = {
    select: () => { mocks.calls.push("select"); return query; },
    is: () => query,
    neq: (...args: unknown[]) => { mocks.calls.push("excludeDraft"); mocks.filters.push(args); return query; },
    eq: (...args: unknown[]) => { mocks.filters.push(args); return query; },
    order: () => query,
    range: () => { mocks.calls.push("paginate"); return query; },
    then: (resolve: (result: { data: never[]; count: number; error: null }) => unknown) =>
      Promise.resolve({ data: [] as never[], count: 0, error: null }).then(resolve),
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
