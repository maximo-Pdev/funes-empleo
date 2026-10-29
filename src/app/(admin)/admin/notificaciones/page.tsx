import { requireActiveAccount } from "@/lib/auth/guards";
import { NotificationsContent } from "@/features/notifications/components/notifications-content";
import { AdminShell } from "../../_components/admin-shell";

export default async function AdminNotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string; unavailable?: string }> }) {
  const session = await requireActiveAccount(["admin"]);
  const params = await searchParams;
  return <AdminShell title="Notificaciones" description="Novedades que requieren la atención de la Oficina de Empleo. Tu lectura es individual." active="/admin/notificaciones" email={session.user.email}>
    <NotificationsContent page={params.page} unavailable={params.unavailable} />
  </AdminShell>;
}
