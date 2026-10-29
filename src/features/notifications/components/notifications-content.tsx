import Link from "next/link";
import { Card } from "@/components/ui";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { listNotifications } from "../service";
import { NotificationItems } from "./notification-items";

export async function NotificationsContent({ page, unavailable }: { page?: string; unavailable?: string }) {
  let data: Awaited<ReturnType<typeof listNotifications>>;
  try { data = await listNotifications(page === undefined ? 1 : Number(page)); }
  catch (error) { return <Card className="p-5"><p role="alert">{publicErrorFrom(error).message}</p><p className="mt-2 text-sm">Volvé a cargar la página para intentar nuevamente.</p></Card>; }
  const pageHref = (value: number) => `${data.listHref}${data.listHref.includes("?") ? "&" : "?"}page=${value}`;
  return <Card className="p-4 sm:p-6">
    {unavailable === "1" && <p role="status" className="mb-4 rounded-lg border border-border bg-secondary p-3">El recurso de esa notificación ya no está disponible o no tenés permiso para consultarlo.</p>}
    <p className="mb-3 text-sm text-muted-foreground">{data.unread} sin leer · {data.total} en total</p>
    <NotificationItems items={data.items} />
    {(data.page > 1 || data.page * data.pageSize < data.total) && <nav aria-label="Páginas de notificaciones" className="mt-4 flex flex-wrap items-center gap-5 border-t border-border pt-3">
      {data.page > 1 && <Link className="inline-flex min-h-11 items-center text-primary underline" href={pageHref(data.page - 1)}>Anterior</Link>}
      <span>Página {data.page}</span>
      {data.page * data.pageSize < data.total && <Link className="inline-flex min-h-11 items-center text-primary underline" href={pageHref(data.page + 1)}>Ver más</Link>}
    </nav>}
  </Card>;
}
