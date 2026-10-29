import { requireActiveAccount } from "@/lib/auth/guards";
import { NotificationsContent } from "@/features/notifications/components/notifications-content";
import { CompanyShell } from "../../_components/company-shell";

export default async function CompanyNotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string; unavailable?: string }> }) {
  const session = await requireActiveAccount(["company"]);
  const params = await searchParams;
  return <CompanyShell title="Notificaciones" description="Novedades de tus ofertas y derivaciones." active="/empresa/notificaciones" email={session.user.email}>
    <NotificationsContent page={params.page} unavailable={params.unavailable} />
  </CompanyShell>;
}
