import { Form } from "@/components/forms/form";
import { Button } from "@/components/ui/button";
import { notificationLabels, type Notification } from "../contracts";
import styles from "./notifications.module.css";

export function NotificationItems({ items }: { items: readonly Notification[] }) {
  if (items.length === 0) return <p className="p-4 text-sm text-muted-foreground">Todavía no tenés notificaciones.</p>;
  return <ul className="divide-y divide-border">{items.map(item => <li key={item.reference} className="py-2">
    <Form action="/api/notifications/open" method="post" className={styles.itemForm}>
      <input type="hidden" name="reference" value={item.reference} />
      <Button type="submit" variant="ghost" className="w-full flex-col items-start gap-1 whitespace-normal px-3 py-3 text-left text-sm">
        <span className="flex w-full items-start gap-2">
          {!item.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
          <span>{notificationLabels[item.kind]}{!item.readAt && <span className="sr-only">. Sin leer</span>}</span>
        </span>
        {item.available && item.subject && <span className="break-words font-normal">{item.subject}</span>}
        {!item.available && <span className="font-normal text-muted-foreground">El recurso ya no está disponible.</span>}
        <time dateTime={item.createdAt} className="text-xs font-normal text-muted-foreground">{new Date(item.createdAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" })}</time>
      </Button>
    </Form>
  </li>)}</ul>;
}
