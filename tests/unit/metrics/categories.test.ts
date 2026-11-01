import { beforeEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { session, order, from } = vi.hoisted(() => ({ session: vi.fn(), order: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: session }));
import { metricsCategories } from "@/features/metrics/service";

beforeEach(() => {
  from.mockReset().mockReturnValue({ select: vi.fn(() => ({ order })) });
  order.mockReset(); session.mockReset().mockResolvedValue({ account: { role: "admin", status: "active" }, client: { from } });
});

it("omits retired A/B while preserving other historical categories and active test fixtures", async () => {
  const rows = [
    { id: "1", name: "Categoría ficticia A", code: "DEMO-A", version: 1, active: false },
    { id: "2", name: "Categoría ficticia B", code: "DEMO-B", version: 1, active: false },
    { id: "3", name: "Administración", code: "ADMINISTRACION", version: 2, active: true },
    { id: "4", name: "Rubro histórico", code: "HISTORICO", version: 1, active: false },
    { id: "5", name: "Fixture activa A", code: "DEMO-A", version: 1, active: true },
    { id: "6", name: "Otra versión", code: "DEMO-B", version: 2, active: false },
  ];
  order.mockResolvedValue({ data: rows, error: null });
  expect(await metricsCategories()).toEqual(rows.slice(2).map(({ id, name, code, version }) => ({ id, name, code, version })));
});

it.each([null, { role: "candidate", status: "active" }, { role: "company", status: "active" }, { role: "admin", status: "suspended" }])(
  "keeps administrative authorization before loading categories: %j", async account => {
    session.mockResolvedValue(account ? { account, client: { from } } : null);
    await expect(metricsCategories()).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    expect(from).not.toHaveBeenCalled();
  },
);

it("propagates a category read error without returning a successful partial catalog", async () => {
  order.mockResolvedValue({ data: [], error: { message: "internal" } });
  await expect(metricsCategories()).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});
