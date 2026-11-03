"use client";


import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { notificationsSchema, type Notifications } from "../contracts";
import { NotificationItems } from "./notification-items";

export function NotificationCenter({ onOpenChange, unavailable = false }: { onOpenChange?: (open: boolean) => void; unavailable?: boolean } = {}) {
  const [data, setData] = useState<Notifications | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const page = useRef(1);
  const load = useCallback(async (requestedPage = page.current) => {
    page.current = requestedPage;
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    setLoading(true);
    try {
      const query = requestedPage === 1 ? "size=5" : `size=5&page=${requestedPage}`;
      const response = await fetch(`/api/notifications?${query}`, { cache: "no-store", credentials: "same-origin", signal: current.signal });
      if (!response.ok) throw new Error("NOTIFICATIONS_UNAVAILABLE");
      const raw = await response.json();
      const { listHref, ...payload } = raw;
      const parsed = notificationsSchema.safeParse(payload);
      if (!parsed.success || parsed.data.page !== requestedPage || parsed.data.pageSize !== 5
        || !["/dashboard", "/empresa", "/admin"].includes(listHref)) throw new Error("INVALID_NOTIFICATIONS");
      if (!current.signal.aborted) { setData(parsed.data); setError(false); }
    } catch {
      if (!current.signal.aborted) { setError(true); setData(null); }
    } finally { if (!current.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") void load(); };
    refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { controller.current?.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [load]);
  const label = error ? "Notificaciones: no se pudieron cargar" : data ? `Notificaciones: ${data.unread} sin leer` : "Notificaciones: cargando";
  return <Popover defaultOpen={unavailable} onOpenChange={open => { onOpenChange?.(open); if (open) void load(1); }}>
    <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label={label} className="relative" />}>
      <Bell aria-hidden="true" />
      {data && data.unread > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-xs text-white">{data.unread > 99 ? "99+" : data.unread}</span>}
      {error && <span aria-hidden="true" className="absolute right-0 top-0 text-destructive">!</span>}
    </PopoverTrigger>
    <PopoverContent align="end" sideOffset={10} className="w-[min(24rem,calc(100vw-2rem))] p-3">
      <PopoverTitle className="text-lg">Notificaciones</PopoverTitle>
      <PopoverDescription>Actividad reciente de tu cuenta.</PopoverDescription>
      {unavailable && <p role="status" className="rounded-lg bg-secondary p-3 text-sm">El recurso de esa notificación ya no está disponible o no tenés permiso para consultarlo.</p>}
      <div aria-live="polite" aria-busy={loading} className="max-h-[min(65dvh,32rem)] overflow-y-auto overscroll-contain">
        {error ? <div role="alert" className="p-3"><p>No pudimos cargar tus notificaciones.</p><Button variant="link" onClick={() => void load()}>Volver a intentar</Button></div>
          : data ? <NotificationItems items={data.items} /> : <p className="p-3">Cargando notificaciones…</p>}
      </div>
      {data && !error && <div className="border-t border-border pt-2">
        <p className="text-xs text-muted-foreground" role="status">{data.unread} sin leer · {data.total} en total</p>
        {(data.page > 1 || data.page * data.pageSize < data.total) && <nav aria-label="Páginas de actividad" className="flex flex-wrap items-center justify-between gap-1">
          {data.page > 1 && <Button variant="link" disabled={loading} onClick={() => void load(data.page - 1)}>Actividad más reciente</Button>}
          <span className="text-xs">Página {data.page}</span>
          {data.page * data.pageSize < data.total && <Button variant="link" disabled={loading} onClick={() => void load(data.page + 1)}>Ver más actividad</Button>}
        </nav>}
      </div>}
    </PopoverContent>
  </Popover>;
}
