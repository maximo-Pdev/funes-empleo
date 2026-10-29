import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ list: vi.fn(), open: vi.fn() }));
vi.mock("@/features/notifications/service", () => ({ listNotifications:mocks.list,openNotification:mocks.open }));
import { GET } from "@/app/api/notifications/route";
import { POST } from "@/app/api/notifications/open/route";
import { AppError } from "@/lib/errors/public-error";
const ref="aviso-"+"a".repeat(24);
function request(body=`reference=${ref}`,headers:Record<string,string>={}) {
  return new Request("https://portal.test/api/notifications/open",{method:"POST",headers:{host:"portal.test",origin:"https://portal.test","content-type":"application/x-www-form-urlencoded",...headers},body});
}
beforeEach(()=>{vi.resetAllMocks();mocks.list.mockResolvedValue({items:[],total:0,unread:0});mocks.open.mockResolvedValue("/admin/empresas/emp-"+"a".repeat(24));});
it("GET es privado y no marca leído",async()=>{
 const result=await GET(new Request("https://portal.test/api/notifications?size=5"));
 expect(result.status).toBe(200);expect(result.headers.get("cache-control")).toBe("private, no-store");expect(result.headers.get("vary")).toBe("Cookie");expect(mocks.open).not.toHaveBeenCalled();
});
it.each(["recipient=otro","page=1&page=2","size=5&size=2"])("GET rechaza filtros %s",async query=>{
 expect((await GET(new Request(`https://portal.test/api/notifications?${query}`))).status).toBe(422);expect(mocks.list).not.toHaveBeenCalled();
});
it("POST marca y responde303 a ruta construida en servidor",async()=>{
 const result=await POST(request());expect(result.status).toBe(303);expect(result.headers.get("location")).toBe("/admin/empresas/emp-"+"a".repeat(24));expect(mocks.open).toHaveBeenCalledExactlyOnceWith(ref);
});
it.each<Record<string,string>>([{origin:"https://otro.test"},{"sec-fetch-site":"cross-site"},{origin:"null"},{origin:"https://portal.test/"},{host:"evil.test"}])("rechaza origen cruzado %o",async headers=>{
 expect((await POST(request(undefined,headers))).status).toBe(403);expect(mocks.open).not.toHaveBeenCalled();
});
it.each(["",`reference=${ref}&reference=${ref}`,`reference=${ref}&url=https://externo.test`,"x".repeat(1100)])("rechaza cuerpo inválido/acotado",async body=>{
 expect((await POST(request(body))).status).toBe(422);expect(mocks.open).not.toHaveBeenCalled();
});
it.each([["AUTH_REQUIRED",401],["ACCESS_DENIED",403],["NOT_FOUND",404],["INTERNAL_ERROR",500]] as const)("traduce %s sin mensaje SQL",async(code,status)=>{
 mocks.open.mockRejectedValue(new AppError(code));const response=await POST(request());expect(response.status).toBe(status);expect(await response.text()).not.toContain("SQL");
});
