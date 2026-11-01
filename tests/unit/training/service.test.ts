import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { session, rpc, resolve, client, query } = vi.hoisted(() => {
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn(), maybeSingle: vi.fn() };
  return { session: vi.fn(), rpc: vi.fn(), resolve: vi.fn(), client: { from: vi.fn(), rpc: vi.fn() }, query };
});
vi.mock("@/lib/auth/session", () => ({ readAccountSession: session }));
vi.mock("@/lib/records/references", () => ({ recordIdentifier: resolve }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: async () => client }));
import { createCourseReferral, saveCourseLink, listCourseLinks, getCourseCandidate, getCourseReferralHistory } from "@/features/training/service";
const candidateId = "11111111-1111-4111-8111-111111111111";
const courseId = "22222222-2222-4222-8222-222222222222";
const reference = "can-" + "a".repeat(24);
beforeEach(() => {
  vi.clearAllMocks();
  session.mockResolvedValue({ account: { role: "admin", status: "active" }, client: { ...client, rpc } });
  rpc.mockResolvedValue({ data: courseId, error: null });
  resolve.mockResolvedValue(candidateId);
  client.from.mockReturnValue(query);
  for (const key of ["select", "eq", "order"] as const) query[key].mockReturnValue(query);
  query.range.mockResolvedValue({ data: [], error: null });
  query.maybeSingle.mockResolvedValue({ data: { id: candidateId, display_name: "Persona ficticia", archived_at: null, status: "active" }, error: null });
});
describe("independent municipal course records", () => {
  it("saves explicit publication state using the request-scoped administrator", async () => {
    await saveCourseLink({ title: "Curso", url: "https://funes.gob.ar/curso", published: false });
    expect(rpc).toHaveBeenCalledWith("save_municipal_course", { p_title: "Curso", p_url: "https://funes.gob.ar/curso", p_published: false, p_course: null });
  });
  it.each([null, { role: "candidate", status: "active" }, { role: "company", status: "active" }, { role: "admin", status: "suspended" }])("denies nonadministrator writes and history before resolving private references: %j", async account => {
    session.mockResolvedValue(account && { account, client: { rpc } });
    await expect(createCourseReferral({ candidateReference: reference, courseId })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    await expect(saveCourseLink({ title: "Curso", url: "https://funes.gob.ar/curso" })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    await expect(getCourseReferralHistory(candidateId, 1)).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    expect(resolve).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled(); expect(client.from).not.toHaveBeenCalled();
  });
  it("resolves an opaque candidate and never asks for a job application", async () => {
    await createCourseReferral({ candidateReference: reference, courseId });
    expect(resolve).toHaveBeenCalledWith("candidate", reference);
    expect(rpc).toHaveBeenCalledWith("create_course_referral", { p_candidate: candidateId, p_course: courseId });
  });
  it("rejects invalid links before sending database commands", async () => {
    await expect(saveCourseLink({ title: "Curso", url: "javascript:alert(1)" })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(rpc).not.toHaveBeenCalled();
  });
  it("returns only published link metadata and distinguishes query failure from empty data", async () => {
    expect(await listCourseLinks()).toEqual([]);
    expect(query.eq).toHaveBeenCalledWith("published", true);
    expect(query.select).toHaveBeenCalledWith("id,title,url,published");
    query.range.mockResolvedValue({ data: null, error: { message: "private detail" } });
    await expect(listCourseLinks()).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });
  it("loads only the selected candidate and preserves archived read-only history", async () => {
    const selected = await getCourseCandidate(reference);
    expect(selected?.display_name).toBe("Persona ficticia");
    expect(query.eq).toHaveBeenCalledWith("id", candidateId);
    query.maybeSingle.mockResolvedValue({ data: { id: candidateId, display_name: "Persona ficticia", archived_at: "2026-10-01", status: "archived" }, error: null });
    expect((await getCourseCandidate(reference))?.archived_at).toBe("2026-10-01");
  });
  it("paginates history scoped to one candidate", async () => {
    expect(await getCourseReferralHistory(candidateId, 2)).toEqual({ items: [], hasNext: false });
    expect(query.eq).toHaveBeenCalledWith("candidate_id", candidateId);
    expect(query.range).toHaveBeenCalledWith(5, 10);
  });
  it("maps RPC rejection without leaking provider details", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "INVALID_TRANSITION" } });
    await expect(createCourseReferral({ candidateReference: reference, courseId })).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });
});
