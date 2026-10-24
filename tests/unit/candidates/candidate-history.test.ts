import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
import { getAdminCandidateHistory } from "@/features/candidates/search-service";
import { loadCandidateHistoryAction } from "@/features/candidates/history-actions";
import { candidateHistoryActions } from "@/features/candidates/candidate-history";
const id = "0a000000-0000-4000-8000-000000000001";
const account = "0a000000-0000-4000-8000-000000000002";
const date = "2026-10-24T12:30:00.123456+00:00";
const events = Array.from({ length: 6 }, (_, index) => ({ id: `0b000000-0000-4000-8000-${String(6-index).padStart(12,"0")}`, action: "profile_activated", occurred_at: date }));
let target: { data: { id: string; account_id: string | null } | null; error: unknown };
let audit: { data: unknown; error: unknown };
type Builder = Record<"select"|"eq"|"in"|"or"|"order"|"maybeSingle"|"limit", ReturnType<typeof vi.fn>>;
const queries = new Map<string, Builder>();
beforeEach(() => {
  vi.clearAllMocks(); queries.clear();
  target = { data: { id, account_id: account }, error: null }; audit = { data: events, error: null };
  mocks.from.mockImplementation((table: string) => {
    const query = {} as Builder;
    for (const method of ["select","eq","in","or","order"] as const) query[method] = vi.fn(() => query);
    query.maybeSingle = vi.fn(async () => target); query.limit = vi.fn(async () => audit);
    queries.set(table, query); return query;
  });
  mocks.session.mockResolvedValue({ account: { role: "admin", status: "active" }, client: { from: mocks.from } });
});
it("solo permite los ocho eventos elegidos y filtra antes de limitar a5+1", async () => {
  expect(candidateHistoryActions).toEqual(["profile_activated","consent_accepted","consent_withdrawn","availability_changed","account_suspended","account_reactivated","profile_linked","freshness_due"]);
  const result = await getAdminCandidateHistory({ candidateId: id });
  expect(result.events).toHaveLength(5);
  expect(result.nextCursor).toEqual({ occurredAt: date, id: events[4]!.id });
  const query = queries.get("audit_events")!;
  expect(query.select).toHaveBeenCalledWith("id,action,occurred_at");
  expect(query.in).toHaveBeenCalledWith("action", [...candidateHistoryActions]);
  expect(query.in.mock.invocationCallOrder[0]!).toBeLessThan(query.limit.mock.invocationCallOrder[0]!);
  expect(query.limit).toHaveBeenCalledWith(6);
  expect(query.or).toHaveBeenCalledWith(`and(entity_type.eq.candidate_profiles,entity_id.eq.${id}),and(entity_type.eq.accounts,entity_id.eq.${account})`);
  expect(query.order.mock.calls).toEqual([["occurred_at",{ ascending:false }],["id",{ ascending:false }]]);
});
it("continúa por fecha e id preservando microsegundos y scope, sin permitir entidades del cliente", async () => {
  audit.data = events.slice(0, 2);
  const cursor = { occurredAt: date, id: events[4]!.id };
  const result = await getAdminCandidateHistory({ candidateId: id, cursor });
  expect(result.nextCursor).toBeNull();
  expect(queries.get("audit_events")!.or).toHaveBeenCalledWith(`and(or(and(entity_type.eq.candidate_profiles,entity_id.eq.${id}),and(entity_type.eq.accounts,entity_id.eq.${account})),or(occurred_at.lt.${date},and(occurred_at.eq.${date},id.lt.${cursor.id})))`);
});
it("sin cuenta vinculada solo consulta el perfil y un vacío no afirma ausencia de auditoría", async () => {
  target.data!.account_id = null; audit.data = [];
  expect(await getAdminCandidateHistory({ candidateId: id })).toEqual({ events: [], nextCursor:null });
  expect(queries.get("audit_events")!.or).toHaveBeenCalledWith(`and(entity_type.eq.candidate_profiles,entity_id.eq.${id})`);
});
it.each([null, { role:"candidate",status:"active" }, { role:"company",status:"active" }, { role:"admin",status:"suspended" }, { role:"admin",status:"archived" }])("rechaza %j antes de acceder a datos", async actor => {
  mocks.session.mockResolvedValue(actor ? { account:actor, client:{ from:mocks.from } } : null);
  expect(await loadCandidateHistoryAction({ candidateId:id })).toMatchObject({ success:false });
  expect(mocks.from).not.toHaveBeenCalled();
});
it.each([
  { candidateId:"invalid" }, { candidateId:id, accountId:account },
  { candidateId:id, cursor:{ occurredAt:"2026-10-24T12:30:00Z),entity_id.neq.null",id } },
  { candidateId:id, cursor:{ occurredAt:date,id:"invalid" } },
  { candidateId:id, cursor:{ occurredAt:date,id,entity_id:account } },
])("rechaza entrada o cursor manipulado: %j", async input => {
  await expect(getAdminCandidateHistory(input)).rejects.toMatchObject({ code:"VALIDATION_ERROR" });
  expect(mocks.from).not.toHaveBeenCalled();
});
it("no consulta auditoría de un perfil inexistente", async () => {
  target.data = null;
  await expect(getAdminCandidateHistory({ candidateId:id })).rejects.toMatchObject({ code:"NOT_FOUND" });
  expect(mocks.from).toHaveBeenCalledTimes(1);
});
it("un error no se convierte en lista vacía ni revela mensajes privados", async () => {
  audit.error = { message:"detalle privado ficticio" }; audit.data = null;
  const result = await loadCandidateHistoryAction({ candidateId:id });
  expect(result.success).toBe(false); expect(JSON.stringify(result)).not.toContain("detalle privado");
});
it("no entrega campos de actor/estados/motivo aunque el transporte los agregue", async () => {
  audit.data = [{ ...events[0], actor_account_id:account, previous_state:"draft", reason_code:"hired" }];
  expect((await getAdminCandidateHistory({ candidateId:id })).events).toEqual([events[0]]);
});
it("rechaza una respuesta con evento no permitido", async () => {
  audit.data = [{ ...events[0], action:"profile_created" }];
  await expect(getAdminCandidateHistory({ candidateId:id })).rejects.toMatchObject({ code:"INTERNAL_ERROR" });
});
