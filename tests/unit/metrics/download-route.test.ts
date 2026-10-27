// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn(), canonical: vi.fn(), refs: vi.fn(), identifier: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
vi.mock("@/lib/records/reference-url", () => ({ referenceUrl: mocks.canonical }));
vi.mock("@/lib/records/references", () => ({ recordReferences: mocks.refs, routeIdentifier: mocks.identifier }));
import { metricsDownload } from "@/features/metrics/download-route";
const row = { indicator: "active_candidates", value: 0, unit: "count", state: "calculated", category_id: null, category_name: null, opening_id: null, opening_title: null };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ account: { role: "admin", status: "active" }, client: { rpc: mocks.rpc } });
  mocks.rpc.mockResolvedValue({ data: { as_of: "2026-10-20T18:00:00Z", history_from: null, rows: [{ ...row, dni: "NO EXPORTAR" }] }, error: null });
  mocks.canonical.mockImplementation(async value => value);
  mocks.refs.mockResolvedValue({});
});
for (const [extension, mime] of [["pdf", "application/pdf"], ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]]) {
  it(`${extension}: autoriza/exporta una vez, valida DTO y devuelve archivo privado`, async () => {
    const serialize = vi.fn().mockResolvedValue(Buffer.from("binario ficticio"));
    const response = await metricsDownload(serialize, mime!, `metricas.${extension}`)(new Request(`http://portal.invalid/api/admin/exports/operations.${extension}?from=2026-10-01&to=2026-10-20`));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(mime);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-disposition")).toContain(`metricas.${extension}`);
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("export_admin_metrics", { p_from: "2026-10-01", p_to: "2026-10-20", p_category: null });
    expect(serialize.mock.calls[0]![0].rows).toEqual([row]);
    expect(await response.text()).toBe("binario ficticio");
  });
}
it.each([null, { role: "company", status: "active" }, { role: "candidate", status: "active" }, { role: "admin", status: "suspended" }])("deniega %j antes de consultar o serializar", async account => {
  mocks.session.mockResolvedValue(account && { account, client: { rpc: mocks.rpc } });
  const serialize = vi.fn();
  const response = await metricsDownload(serialize, "application/pdf", "metricas.pdf")(new Request("http://portal.invalid/api/admin/exports/operations.pdf?from=2026-10-01&to=2026-10-20"));
  expect(response.status).toBe(403);
  expect(mocks.rpc).not.toHaveBeenCalled(); expect(serialize).not.toHaveBeenCalled();
});
it.each(["from=2026-10-01&from=2026-10-02&to=2026-10-20", "from=2026-10-01&to=2026-10-20&owner=otro", "from=no&to=2026-10-20", "from=2026-10-21&to=2026-10-20"])('rechaza filtros inválidos %s antes de exportar', async query => {
  const serialize = vi.fn();
  const response = await metricsDownload(serialize, "application/pdf", "metricas.pdf")(new Request(`http://portal.invalid/api/admin/exports/operations.pdf?${query}`));
  expect(response.status).toBe(400); expect(mocks.rpc).not.toHaveBeenCalled(); expect(serialize).not.toHaveBeenCalled();
});
it("canoniza referencias antes de exportar y sanitiza un error de generación", async () => {
  mocks.canonical.mockResolvedValue("/api/admin/exports/operations.pdf?category=rub-111111111111111111111111");
  const serialize = vi.fn();
  const handler = metricsDownload(serialize, "application/pdf", "metricas.pdf");
  const response = await handler(new Request("http://portal.invalid/api/admin/exports/operations.pdf?category=00000000-0000-4000-8000-000000000001"));
  expect(response.status).toBe(307); expect(mocks.rpc).not.toHaveBeenCalled();
  mocks.canonical.mockImplementation(async value => value);
  serialize.mockRejectedValue(new Error("SQL SECRET PATH PRIVADO"));
  const error = await handler(new Request("http://portal.invalid/api/admin/exports/operations.pdf?from=2026-10-01&to=2026-10-20"));
  expect(error.status).toBe(400); expect(await error.text()).not.toMatch(/SQL|SECRET|PATH|PRIVADO/);
});
