"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { notificationsSchema, type Notifications } from "../contracts";
import { NotificationItems } from "./notification-items";

type NotificationSummary = Notifications & { listHref: string };
const listHrefs = ["/admin/notificaciones", "/empresa/notificaciones", "/dashboard?section=notificaciones"];

export function NotificationCenter() {
  const [data, setData] = useState<NotificationSummary | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    setLoading(true);
    try {
      const response = await fetch("/api/notifications?size=5", { cache: "no-store", credentials: "same-origin", signal: current.signal });
      if (!response.ok) throw new Error("NOTIFICATIONS_UNAVAILABLE");
      const raw = await response.json();
      const { listHref, ...payload } = raw;
      const parsed = notificationsSchema.safeParse(payload);
      if (!parsed.success || typeof listHref !== "string" || !listHrefs.includes(listHref)) throw new Error("INVALID_NOTIFICATIONS");
      if (!current.signal.aborted) { setData({ ...parsed.data, listHref }); setError(false); }
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
  return <Popover onOpenChange={open => { if (open) void load(); }}>
    <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label={label} className="relative" />}>
      <Bell aria-hidden="true" />
      {data && data.unread > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-xs text-white">{data.unread > 99 ? "99+" : data.unread}</span>}
      {error && <span aria-hidden="true" className="absolute right-0 top-0 text-destructive">!</span>}
    </PopoverTrigger>
    <PopoverContent align="end" sideOffset={10} className="w-[min(24rem,calc(100vw-2rem))] p-3">
      <PopoverTitle className="text-lg">Notificaciones</PopoverTitle>
      <div aria-live="polite" aria-busy={loading} className="max-h-[min(65dvh,32rem)] overflow-y-auto overscroll-contain">
        {error ? <div role="alert" className="p-3"><p>No pudimos cargar tus notificaciones.</p><Button variant="link" onClick={() => void load()}>Volver a intentar</Button></div>
          : data ? <NotificationItems items={data.items} /> : <p className="p-3">Cargando notificaciones…</p>}
      </div>
      {data && <Link href={data.listHref} className="inline-flex min-h-11 items-center justify-center border-t border-border text-sm font-semibold text-primary underline">Ver todas las notificaciones</Link>}
    </PopoverContent>
  </Popover>;
}
