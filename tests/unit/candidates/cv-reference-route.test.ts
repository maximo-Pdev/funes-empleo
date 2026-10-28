import { beforeEach, expect, it, vi } from "vitest";
import { Blob as NodeBlob } from "node:buffer";
const mocks = vi.hoisted(() => ({ session: vi.fn(), resolve: vi.fn(), reference: vi.fn(), rpc: vi.fn(), download: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
vi.mock("@/lib/records/references", () => ({ routeIdentifier: mocks.resolve, recordReference: mocks.reference }));
import { GET } from "@/app/api/cv/[cvId]/route";
const id = "0a000000-0000-4000-8000-000000000001";
const reference = "cv-0123456789abcdef01234567";
const request = new Request("http://portal.invalid/api/cv/fixture");
const params = (cvId = reference) => ({ params: Promise.resolve({ cvId }) });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ account: { status: "active" }, client: { rpc: mocks.rpc,
    storage: { from: () => ({ download: mocks.download }) } } });
  mocks.resolve.mockResolvedValue(id);
  mocks.reference.mockResolvedValue(reference);
  mocks.rpc.mockResolvedValue({ data: "private/path.pdf", error: null });
  mocks.download.mockResolvedValue({ data: new NodeBlob(["%PDF-ficticio"]), error: null });
});
it("referencia descarga por streaming y reautoriza UUID tanto en RPC como Storage", async () => {
  const response = await GET(request, params());
  expect(mocks.resolve).toHaveBeenCalledWith("cv", reference);
  expect(mocks.rpc).toHaveBeenCalledWith("authorized_cv_path", { p_cv: id });
  expect(mocks.download).toHaveBeenCalledWith("private/path.pdf");
  expect(response.status).toBe(200);
  expect(await response.text()).toBe("%PDF-ficticio");
  expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("vary")).toBe("Cookie");
  expect(response.headers.get("content-disposition")).toBe('inline; filename="cv.pdf"');
  expect(response.headers.get("location")).toBeNull();
});
it("enlace UUID anterior autorizado redirige a código, sin emitir Storage ni descargar", async () => {
  const response = await GET(request, params(id));
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(`/api/cv/${reference}`);
  expect(mocks.download).not.toHaveBeenCalled();
});
it.each([null, { account: { status: "suspended" } }])("sesión no activa no consulta ni resuelve: %j", async session => {
  mocks.session.mockResolvedValue(session);
  expect((await GET(request, params())).status).toBe(401);
  expect(mocks.resolve).not.toHaveBeenCalled();
  expect(mocks.download).not.toHaveBeenCalled();
});
it("referencia inexistente, ajena o revocada devuelve el mismo 404", async () => {
  mocks.resolve.mockRejectedValue(new Error("dato interno ficticio"));
  const response = await GET(request, params());
  expect(response.status).toBe(404);
  expect(await response.text()).not.toContain("dato interno");
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.download).not.toHaveBeenCalled();
});
it("revocación entre lookup y permiso no entrega CV", async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { message: "NOT_FOUND" } });
  expect((await GET(request, params())).status).toBe(404);
  expect(mocks.download).not.toHaveBeenCalled();
});
it("Storage vuelve a comprobar permisos aunque el RPC haya autorizado", async () => {
  mocks.download.mockResolvedValue({ data: null, error: { message: "ACCESS_DENIED" } });
  const response = await GET(request, params());
  expect(response.status).toBe(404);
  expect(await response.text()).not.toContain("private/path.pdf");
});
