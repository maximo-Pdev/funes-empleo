import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { LinkButton } from "@/components/ui/link-button";
import { FeedbackMessage } from "@/components/ui";
import { requireActiveAccount } from "@/lib/auth/guards";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { Dashboard } from "@/features/metrics/components/dashboard";
import { getMetrics, MetricsHistoryUnavailable } from "@/features/metrics/service";
import { localToday } from "@/validation/metrics";
import { formatFunesDateTime } from "@/lib/time/presentation";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const { user } = await requireActiveAccount(["admin"]);
  const today = localToday();
  let result: Awaited<ReturnType<typeof getMetrics>> | null = null;
  let error: string | null = null;
  try {
    result = await getMetrics({ from: today, to: today });
  } catch (cause) {
    error = cause instanceof MetricsHistoryUnavailable
      ? "El historial todavía no permite calcular los indicadores de hoy. No se muestran cifras estimadas."
      : publicErrorFrom(cause).message;
  }
  return <AdminShell title="Panel de administración" active="/admin" email={user?.email}
    description="Un panorama de la Oficina de Empleo: perfiles y ofertas al momento de la consulta, y actividad registrada hoy.">
    <nav aria-label="Próximas acciones de la Oficina" className="mb-8 flex flex-wrap gap-3">
      <LinkButton href="/admin/openings">Revisar ofertas</LinkButton>
      <LinkButton href="/admin/participations">Revisar postulaciones</LinkButton>
      <LinkButton href="/admin/metrics">Consultar otro período y exportar</LinkButton>
    </nav>
    {error && <FeedbackMessage tone="error">{error}</FeedbackMessage>}
    {result && <>
      <p className="mb-5 text-sm text-muted-foreground">Actualizado al {formatFunesDateTime(result.as_of)}. Los desgloses por categoría pueden superponerse.</p>
      <Dashboard rows={result.rows} />
    </>}
  </AdminShell>;
}
