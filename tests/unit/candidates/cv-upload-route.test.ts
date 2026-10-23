import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));
vi.mock("@/lib/env/client", () => ({ getClientEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000" }) }));
vi.mock("@/lib/files/pdf-validation", () => ({ validatePdf: vi.fn() }));
import { readAccountSession } from "@/lib/auth/session";
import { validatePdf } from "@/lib/files/pdf-validation";
import { POST } from "@/app/api/candidate/cv/route";

const candidateId = "0a000000-0000-4000-8000-000000000001";
const ownerId = "0a000000-0000-4000-8000-000000000002";
const rpc = vi.fn();
const upload = vi.fn();
const profile = vi.fn();

function session(role = "candidate", accountId = ownerId, status = "active") {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: profile };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
  vi.mocked(readAccountSession).mockResolvedValue({ account: { id: accountId, role, status },
    client: { from: () => query, rpc, storage: { from: () => ({ upload }) } } } as never);
}
function request(accept = "application/json", version = "2") {
  const file = new File(["PDF ficticio"], "ficticio.pdf", { type: "application/pdf" });
  Object.defineProperty(file, "arrayBuffer", { value: async () => new ArrayBuffer(8) });
  const form = new FormData(); form.set("candidateId", candidateId); form.set("version", version); form.set("cv", file);
  return { headers: new Headers({ accept }), formData: async () => form } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  session();
  profile.mockResolvedValue({ data: { id: candidateId, account_id: ownerId, version: 2, archived_at: null }, error: null });
  rpc.mockResolvedValue({ error: null }); upload.mockResolvedValue({ error: null });
  vi.mocked(validatePdf).mockReturnValue(null);
});

it("mantiene el redirect 303 para los clientes sin opt-in JSON", async () => {
  const response = await POST(request("text/html"));
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("http://127.0.0.1:3000/candidato/perfil?cv=invalid");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

it("devuelve un error JSON seguro sin navegar ni subir el PDF rechazado", async () => {
  const response = await POST(request());
  expect(response.status).toBe(422);
  expect(await response.json()).toEqual({ status: "invalid" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("location")).toBeNull();
  expect(rpc).not.toHaveBeenCalled(); expect(upload).not.toHaveBeenCalled();
});

it.each(["company", "candidate-other", "suspended", "anonymous"])("preserva la autorización: %s", async role => {
  if (role === "anonymous") vi.mocked(readAccountSession).mockResolvedValue(null);
  else session(role === "company" ? "company" : "candidate", role === "candidate-other" ? "other" : ownerId,
    role === "suspended" ? "suspended" : "active");
  const response = await POST(request());
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ status: "denied" });
  expect(rpc).not.toHaveBeenCalled(); expect(upload).not.toHaveBeenCalled();
});

it("informa conflicto de versión sin modificar el CV", async () => {
  const response = await POST(request("application/json", "1"));
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ status: "conflict" });
  expect(upload).not.toHaveBeenCalled();
});

it("permite al administrador cargar y solo confirma éxito luego del commit", async () => {
  session("admin");
  vi.mocked(validatePdf).mockReturnValue({ bytes: new Uint8Array([37, 80, 68, 70]), safeName: "ficticio.pdf", size: 4, sha256: "ficticio" });
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
  expect(rpc).toHaveBeenNthCalledWith(1, "reserve_candidate_cv", expect.objectContaining({ p_candidate: candidateId, p_expected_version: 2 }));
  expect(upload).toHaveBeenCalledOnce();
  expect(rpc).toHaveBeenNthCalledWith(2, "commit_candidate_cv", expect.objectContaining({ p_candidate: candidateId }));
});

vi.mock("@/lib/records/reference-url", async () => ({ referenceUrl: async (href: string) => (await import("../../fixtures/record-references")).fixtureHref(href) }));
