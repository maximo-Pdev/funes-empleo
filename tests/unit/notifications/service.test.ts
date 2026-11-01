import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), rpc: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
import { candidatePreinterviewAgenda, listNotifications, openNotification } from "@/features/notifications/service";
import { notificationSchema, notificationTarget, type NotificationRole } from "@/features/notifications/contracts";

const reference = "aviso-" + "a".repeat(24);
const item = { reference, kind: "candidate_nominated", createdAt: "2026-10-28T10:00:00+00:00", readAt: null, available: true, subject: "Oferta ficticia", target: { kind: "candidate_participation", reference: "cas-" + "b".repeat(24) } };
const payload = { total: 1, unread: 1, page: 1, pageSize: 10, items: [item] };
function session(role: NotificationRole = "candidate", status = "active") { return { account: { role, status }, client: { rpc: mocks.rpc } }; }
beforeEach(() => { vi.resetAllMocks(); mocks.session.mockResolvedValue(session()); mocks.rpc.mockResolvedValue({ data: payload, error: null }); });

it.each([listNotifications, () => openNotification(reference), candidatePreinterviewAgenda])("exige sesión antes de RPC", async run => {
  mocks.session.mockResolvedValue(null); await expect(run()).rejects.toMatchObject({ code: "AUTH_REQUIRED" }); expect(mocks.rpc).not.toHaveBeenCalled();
});
it.each(["suspended", "archived", "pending_verification"])("bloquea cuenta %s", async status => {
  mocks.session.mockResolvedValue(session("candidate", status)); await expect(listNotifications()).rejects.toMatchObject({ code: "ACCESS_DENIED" }); expect(mocks.rpc).not.toHaveBeenCalled();
});
it("consulta exclusivamente al actor sin parámetro de destinatario", async () => {
  await expect(listNotifications()).resolves.toMatchObject({ ...payload, listHref: "/dashboard?section=notificaciones" });
  expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("list_my_notifications", { p_page: 1, p_page_size: 10 });
});
it.each([[0,20],[1,21],[1,0],[10001,20],[1.5,5],[NaN,5]])("rechaza paginación inválida %s/%s", async (page,size) => {
  await expect(listNotifications(page,size)).rejects.toMatchObject({ code: "VALIDATION_ERROR" }); expect(mocks.rpc).not.toHaveBeenCalled();
});
it.each([null, {}, { ...payload, items: [{...item, summary_internal:"privado"}] }, { ...payload, items:[{...item,target:{...item.target,reference:"00000000-0000-4000-8000-000000000001"}}] }])("no expone contratos rotos ni campos adicionales", async data => {
  mocks.rpc.mockResolvedValue({ data,error:null }); await expect(listNotifications()).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});
it("no construye destinos de un rol diferente", async () => {
  mocks.session.mockResolvedValue(session("company")); await expect(listNotifications()).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
});
it("marca y navega al caso opaco", async () => {
  mocks.rpc.mockResolvedValue({ data:item,error:null });
  await expect(openNotification(reference)).resolves.toBe(`/dashboard?section=postulaciones#${item.target.reference}`);
  expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("open_my_notification", {p_reference:reference});
});
it.each(["../otro", "https://externo.test/", "00000000-0000-4000-8000-000000000001", undefined])("rechaza referencia inválida %s", async ref => {
  await expect(openNotification(ref)).rejects.toMatchObject({code:"NOT_FOUND"}); expect(mocks.rpc).not.toHaveBeenCalled();
});
it("recurso inaccesible vuelve a lista sin URL o asunto viejo", async () => {
  mocks.rpc.mockResolvedValue({data:{...item,available:false,subject:null,target:null},error:null});
  await expect(openNotification(reference)).resolves.toBe("/dashboard?section=notificaciones&unavailable=1");
});
it("no expone errores internos SQL", async () => {
  mocks.rpc.mockResolvedValue({data:null,error:{message:"secret SQL"}}); await expect(listNotifications()).rejects.toMatchObject({code:"INTERNAL_ERROR"});
});
it.each(["company", "admin"] as const)("agenda denegada para %s", async role => {
  mocks.session.mockResolvedValue(session(role)); await expect(candidatePreinterviewAgenda()).rejects.toMatchObject({code:"ACCESS_DENIED"}); expect(mocks.rpc).not.toHaveBeenCalled();
});
it("agenda solo admite fechas/canal y referencia sin notas", async () => {
  mocks.rpc.mockResolvedValue({data:[{reference:item.target.reference,scheduledAt:item.createdAt,heldAt:null,channel:"video"}],error:null});
  await expect(candidatePreinterviewAgenda()).resolves.toHaveLength(1);
  mocks.rpc.mockResolvedValue({data:[{reference:item.target.reference,scheduledAt:null,heldAt:null,channel:"video",summary_internal:"privado"}],error:null});
  await expect(candidatePreinterviewAgenda()).rejects.toMatchObject({code:"INTERNAL_ERROR"});
});
it.each([
  ["admin","admin_review","admin_opening","ofe","/admin/openings/"],
  ["admin","admin_company_registered","admin_company","emp","/admin/empresas/"],
  ["admin","admin_application","admin_participation","cas","/admin/participations/"],
  ["company","company_published","company_opening","ofe","/empresa/ofertas/"],
] as const)("ruta %s/%s usa solo referencia validada", (role,kind,targetKind,prefix,path) => {
  const value=notificationSchema.parse({...item,kind,target:{kind:targetKind,reference:`${prefix}-${"b".repeat(24)}`}});
  expect(notificationTarget(value,role)).toBe(`${path}${prefix}-${"b".repeat(24)}`);
});
