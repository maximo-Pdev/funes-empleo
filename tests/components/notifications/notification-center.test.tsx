import { afterEach,beforeEach,expect,it,vi } from "vitest";
import { act,fireEvent,render,screen,waitFor } from "@testing-library/react";
import { NotificationCenter } from "@/features/notifications/components/notification-center";
import { NotificationItems } from "@/features/notifications/components/notification-items";
import type { Notification } from "@/features/notifications/contracts";
const item:Notification={reference:"aviso-"+"a".repeat(24),kind:"candidate_nominated",createdAt:"2026-10-28T10:00:00Z",readAt:null,available:true,subject:"Oferta ficticia",target:{kind:"candidate_participation",reference:"cas-"+"b".repeat(24)}};
const data={total:1,unread:1,page:1,pageSize:5,items:[item],listHref:"/dashboard?section=notificaciones"};
const fetchMock=vi.fn();
beforeEach(()=>{fetchMock.mockReset();fetchMock.mockResolvedValue({ok:true,json:async()=>data});vi.stubGlobal("fetch",fetchMock);});
afterEach(()=>vi.unstubAllGlobals());
it("muestra pendientes, abre popover accesible y formularioPOST sin UUID",async()=>{
 const view=render(<NotificationCenter/>);const trigger=await screen.findByRole("button",{name:"Notificaciones: 1 sin leer"});
 fireEvent.click(trigger);expect(await screen.findByText("Oferta ficticia")).toBeTruthy();
 expect(screen.getByText("28/10/2026, 07:00")).toBeTruthy();
 const notice=screen.getByRole("button",{name:/La Oficina te incorporó/});const form=notice.closest("form")!;
 expect(form.getAttribute("method")).toBe("post");expect(form.getAttribute("action")).toBe("/api/notifications/open");expect(form.querySelector("input")?.value).toBe(item.reference);
 expect(screen.getByRole("link",{name:"Ver todas las notificaciones"}).getAttribute("href")).toBe(data.listHref);
 expect(view.container.textContent).not.toContain("candidate_nominated");
});
it("error nunca se presenta como cero y permite reintentar",async()=>{
 fetchMock.mockRejectedValueOnce(new Error("Fallo"));render(<NotificationCenter/>);
 const trigger=await screen.findByRole("button",{name:"Notificaciones: no se pudieron cargar"});
 fetchMock.mockRejectedValueOnce(new Error("Fallo"));fireEvent.click(trigger);
 expect(await screen.findByRole("alert")).toBeTruthy();expect(screen.queryByText("Todavía no tenés notificaciones.")).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"Volver a intentar"}));await waitFor(()=>expect(screen.getByText("Oferta ficticia")).toBeTruthy());
});
it("distingue vacío real y recurso inaccesible sin asunto viejo",()=>{
 const view=render(<NotificationItems items={[]}/>);expect(screen.getByText("Todavía no tenés notificaciones.")).toBeTruthy();
 view.rerender(<NotificationItems items={[{...item,available:false,subject:null,target:null}]}/>);expect(screen.getByText("El recurso ya no está disponible.")).toBeTruthy();expect(screen.queryByText(item.subject!)).toBeNull();
});
it("descarta respuestas al desmontar y solicita sin caché",async()=>{
 let complete:((value:unknown)=>void)|undefined;
 fetchMock.mockReturnValue(new Promise(resolve=>{complete=resolve;}));const view=render(<NotificationCenter/>);
 expect(fetchMock).toHaveBeenCalledWith("/api/notifications?size=5",expect.objectContaining({cache:"no-store",credentials:"same-origin"}));
 const signal=fetchMock.mock.calls[0]![1].signal as AbortSignal;view.unmount();expect(signal.aborted).toBe(true);
 await act(async()=>{complete?.({ok:true,json:async()=>data});});
});
