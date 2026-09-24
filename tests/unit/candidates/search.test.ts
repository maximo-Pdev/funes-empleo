import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));
import { candidateSearchSchema } from "@/validation/candidate-search";
import { candidateIsReferralEligible, paginateCandidates, type CandidateSearchRow } from "@/features/candidates/search-service";
import { readAccountSession } from "@/lib/auth/session";

const current = new Date("2026-09-23T12:00:00Z");

describe("búsqueda administrativa de candidatos", () => {
  it("normaliza paginación y rechaza patrones de búsqueda no seguros", () => {
    expect(candidateSearchSchema.parse({ page: "2", pageSize: "10", term: " Persona ficticia " })).toMatchObject({
      page: 2, pageSize: 10, term: "Persona ficticia", vigency: "current", eligibility: "eligible",
    });
    expect(candidateSearchSchema.safeParse({ term: "%,status.eq.active" }).success).toBe(false);
    expect(candidateSearchSchema.safeParse({ pageSize: "10000" }).success).toBe(false);
  });

  it("revalida la última decisión de consentimiento, CV, cuenta y frescura", () => {
    const base: Pick<CandidateSearchRow, "account_id" | "status" | "availability" | "archived_at" | "refresh_due_at" | "accounts" | "candidate_consents" | "cv_documents"> = {
      account_id: "account-1", status: "active", availability: "available", archived_at: null,
      refresh_due_at: "2027-01-01T00:00:00Z", accounts: { status: "active" },
      candidate_consents: [{ id: "consent-1", status: "accepted", recorded_at: "2026-09-20T00:00:00Z" }],
      cv_documents: [{ status: "valid", archived_at: null }],
    };
    expect(candidateIsReferralEligible(base, current)).toBe(true);
    expect(candidateIsReferralEligible({ ...base, candidate_consents: [
      ...base.candidate_consents, { id: "consent-2", status: "withdrawn", recorded_at: "2026-09-21T00:00:00Z" },
    ] }, current)).toBe(false);
    expect(candidateIsReferralEligible({ ...base, accounts: { status: "suspended" } }, current)).toBe(false);
    expect(candidateIsReferralEligible({ ...base, refresh_due_at: "2026-09-23T11:59:59Z" }, current)).toBe(false);
    expect(candidateIsReferralEligible({ ...base, cv_documents: [] }, current)).toBe(false);
    expect(candidateIsReferralEligible({ ...base, availability: null }, current)).toBe(false);
    expect(candidateIsReferralEligible({ ...base, availability: "unavailable" }, current)).toBe(false);
    expect(candidateIsReferralEligible({ ...base, account_id: null, accounts: null }, current)).toBe(true);
  });

  it("pagina después de filtrar para que filas y conteo coincidan", () => {
    const result = paginateCandidates(["a", "b", "c", "d", "e"], 2, 2);
    expect(result).toEqual({ items: ["c", "d"], total: 5, page: 2, pageSize: 2, pageCount: 3 });
  });

  it("deniega la búsqueda a cuentas no administrativas", async () => {
    vi.mocked(readAccountSession).mockResolvedValue({ account: { role: "company", status: "active" } } as never);
    const { searchCandidates } = await import("@/features/candidates/search-service");
    await expect(searchCandidates({})).rejects.toMatchObject({ code: "ACCESS_DENIED" });
  });

  it("cuenta y pagina candidatos elegibles sin incluir consentimientos retirados", async () => {
    const rows = [
      { id: "a", display_name: "A", candidate_consents: [{ id: "1", status: "accepted", recorded_at: "2026-09-20T00:00:00Z" }] },
      { id: "b", display_name: "B", candidate_consents: [{ id: "2", status: "withdrawn", recorded_at: "2026-09-21T00:00:00Z" }, { id: "1", status: "accepted", recorded_at: "2026-09-20T00:00:00Z" }] },
      { id: "c", display_name: "C", candidate_consents: [{ id: "1", status: "accepted", recorded_at: "2026-09-20T00:00:00Z" }] },
    ].map((row) => ({ ...row, account_id: null, accounts: null, locality: "Funes", skills_experience_summary: null,
      availability: "available", status: "active", refresh_due_at: "2027-01-01T00:00:00Z",
      archived_at: null, version: 1, candidate_categories: [], cv_documents: [{ status: "valid", archived_at: null }] }));
    const query = { is: vi.fn(), order: vi.fn(), range: vi.fn(), eq: vi.fn(), gt: vi.fn(),
      then: (resolve: (value: unknown) => unknown) => resolve({ data: rows, error: null }) };
    for (const method of ["is", "order", "range", "eq", "gt"] as const) query[method].mockReturnValue(query);
    const client = { from: vi.fn(() => ({ select: vi.fn(() => query) })),
      rpc: vi.fn().mockResolvedValue({ data: 0, error: null }) };
    vi.mocked(readAccountSession).mockResolvedValue({ account: { role: "admin", status: "active" }, client } as never);
    const { searchCandidates } = await import("@/features/candidates/search-service");
    const result = await searchCandidates({ page: 2, pageSize: 1 }, current);
    expect(result).toMatchObject({ total: 2, page: 2, pageCount: 2 });
    expect(result.items.map((item) => item.id)).toEqual(["c"]);
    expect(client.rpc).toHaveBeenCalledWith("refresh_candidate_freshness", { p_candidate: undefined });
  });
});
