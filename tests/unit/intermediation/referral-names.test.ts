import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { session, rpc } = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: session }));
import { getCompanyReferral, listCompanyReferralReferences } from "@/features/referrals/service";
const id = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
const summary = { referral_id: id, opening_id: id, opening_title: "Oferta ficticia", referred_at: "2026-10-25T12:00:00Z", candidate_name: "Persona ficticia" };
const detail = { referralId: id, openingId: id, openingTitle: summary.opening_title, referredAt: summary.referred_at, candidateName: summary.candidate_name };
beforeEach(() => {
  vi.resetAllMocks();
  session.mockResolvedValue({ account: { role: "company", status: "active" }, client: { rpc } });
});
it("valida la lista mínima sin datos privados y usa una sola consulta autorizada", async () => {
  rpc.mockResolvedValue({ data: [{ ...summary, dni: "privado", contacts: ["privado"] }], error: null });
  expect(await listCompanyReferralReferences(id)).toEqual([summary]);
  expect(rpc).toHaveBeenCalledExactlyOnceWith("company_referral_summaries", { p_opening: id });
});
it("transporta solo el nombre disponible del detalle revocado", async () => {
  rpc.mockResolvedValue({ data: { ...detail, contacts: ["privado"], cvDocumentId: other }, error: null });
  expect(await getCompanyReferral(id, id)).toEqual(detail);
});
it("un perfil con permiso completo y categorías antiguas sigue identificable", async () => {
  const candidate = { displayName: detail.candidateName, locality: "Funes", skillsExperienceSummary: null,
    availability: "available", categories: [{ name: "Comercio", kind: "interest" }], contacts: [], cvDocumentId: other };
  rpc.mockResolvedValue({ data: { ...detail, candidate }, error: null });
  expect(await getCompanyReferral(id, id)).toEqual({ ...detail, candidate: { ...candidate, categories: [{ name: "Comercio" }] } });
});
it.each([null, {}, [{ ...summary, opening_id: other }], [{ ...summary, candidate_name: null }], [{ ...summary, referral_id: "inválido" }]])(
  "rechaza lista inválida o cruzada %j", async data => {
    rpc.mockResolvedValue({ data, error: null });
    await expect(listCompanyReferralReferences(id)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  },
);
it("no mezcla el detalle de otra derivación de la misma oferta", async () => {
  rpc.mockResolvedValue({ data: { ...detail, referralId: other }, error: null });
  await expect(getCompanyReferral(id, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
});
it.each([null, { role: "admin", status: "active" }, { role: "candidate", status: "active" }, { role: "company", status: "suspended" }])(
  "deniega actor %j antes de consultar", async account => {
    session.mockResolvedValue(account && { account, client: { rpc } });
    await expect(listCompanyReferralReferences(id)).rejects.toMatchObject({ code: account ? "NOT_FOUND" : "AUTH_REQUIRED" });
    await expect(getCompanyReferral(id, id)).rejects.toMatchObject({ code: account ? "NOT_FOUND" : "AUTH_REQUIRED" });
    expect(rpc).not.toHaveBeenCalled();
  },
);
it.each([["NOT_FOUND", "NOT_FOUND"], ["detalle privado", "INTERNAL_ERROR"]])("sanea error de lista %s", async (message, code) => {
  rpc.mockResolvedValue({ data: null, error: { message } });
  await expect(listCompanyReferralReferences(id)).rejects.toMatchObject({ code, message: code });
});
it("conserva resultado vacío y rechaza IDs inválidos antes de sesión", async () => {
  rpc.mockResolvedValue({ data: [], error: null });
  expect(await listCompanyReferralReferences(id)).toEqual([]);
  session.mockClear();
  await expect(listCompanyReferralReferences("inválido")).rejects.toMatchObject({ code: "NOT_FOUND" });
  expect(session).not.toHaveBeenCalled();
});
