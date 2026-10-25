import { beforeEach, expect, it, vi } from "vitest";
import { openingPreview } from "../../fixtures/opening-preview";

vi.mock("server-only", () => ({}));
const { session, rpc } = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: session }));
import { openingCandidatePreviewAction } from "@/features/candidates/matching-actions";

const input = { openingId: openingPreview.openingId, candidateId: openingPreview.id };
const cvReference = "cv-111111111111111111111111";

beforeEach(() => {
  vi.resetAllMocks();
  session.mockResolvedValue({ account: { role: "admin", status: "active" }, client: { rpc } });
  rpc.mockImplementation(async (name: string) => ({ error: null, data: name === "preview_opening_candidate"
    ? { ...openingPreview, categories: [{ ...openingPreview.categories[0], kind: "interest" }],
      dni: "privado", contacts: ["privado"], notes: "privado" }
    : { [openingPreview.cvId]: cvReference } }));
});

it("recorre RPC, validación y referencia protegida con categorías legadas", async () => {
  expect(await openingCandidatePreviewAction(input)).toEqual({ code: "OK", profile: { ...openingPreview, cvReference } });
  expect(rpc.mock.calls).toEqual([
    ["preview_opening_candidate", { p_opening: input.openingId, p_candidate: input.candidateId }],
    ["get_record_references", { p_kind: "cv", p_ids: [openingPreview.cvId] }],
  ]);
});

it.each([null, { role: "company", status: "active" }, { role: "candidate", status: "active" },
  { role: "admin", status: "suspended" }])("deniega %j antes de leer perfil o CV", async account => {
  session.mockResolvedValue(account && { account, client: { rpc } });
  expect(await openingCandidatePreviewAction(input)).toEqual({ code: "ACCESS_DENIED", profile: null });
  expect(rpc).not.toHaveBeenCalled();
});

it("no entrega un perfil parcial si el CV ya no tiene referencia autorizada", async () => {
  rpc.mockResolvedValueOnce({ data: openingPreview, error: null }).mockResolvedValueOnce({ data: {}, error: null });
  expect(await openingCandidatePreviewAction(input)).toEqual({ code: "NOT_FOUND", profile: null });
});

it("no busca el CV cuando la respuesta identifica a otra persona", async () => {
  rpc.mockResolvedValue({ data: { ...openingPreview, id: openingPreview.cvId }, error: null });
  expect(await openingCandidatePreviewAction(input)).toEqual({ code: "INTERNAL_ERROR", profile: null });
  expect(rpc).toHaveBeenCalledOnce();
});
