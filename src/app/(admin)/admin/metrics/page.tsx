import { formatFunesDateTime } from "@/lib/time/presentation";
import { referenceFilters } from "@/lib/records/page-references";
import { recordReferences } from "@/lib/records/references";
import { RecordAnchor } from "@/components/ui/record-link";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { FeedbackMessage } from "@/components/ui";
import { requireActiveAccount } from "@/lib/auth/guards";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { getMetrics, metricsCategories, MetricsHistoryUnavailable } from "@/features/metrics/service";
import { Dashboard } from "@/features/metrics/components/dashboard";
import { localToday, metricsFilterSchema, metricsQuery } from "@/validation/metrics";
export const dynamic = "force-dynamic";
export default async function MetricsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user } = await requireActiveAccount(["admin"]);
  const raw = await referenceFilters("/admin/metrics", await searchParams, { category: "category" });
  const today = localToday();
  const parsed = metricsFilterSchema.safeParse({ from: `${today.slice(0, 7)}-01`, to: today, ...raw });
  let result: Awaited<ReturnType<typeof getMetrics>> | null = null;
  let error: string | null = parsed.success ? null : "Revisá las fechas y la categoría. Usá un período válido, sin filtros repetidos.";
  let categories: Awaited<ReturnType<typeof metricsCategories>> = [];
  try {
    categories = await metricsCategories();
    if (parsed.success) result = await getMetrics(parsed.data);
  } catch (e) {
    error = e instanceof MetricsHistoryUnavailable ? `No hay evidencia histórica suficiente para ese período. ${e.message ? `El historial fiable comienza el ${formatFunesDateTime(e.message)}; elegí fechas desde el día siguiente.` : "Elegí un período posterior al inicio del historial."} No se sustituyen datos históricos por valores actuales.` : publicErrorFrom(e).message;
  }
  const categoryReferences = await recordReferences("category", categories.map(category => category.id));
  return <AdminShell email={user?.email} active="/admin/metrics" title="Métricas operativas" description="Información interna de la Oficina de Empleo. No es un informe oficial municipal o provincial."
    navigation={[{ href: "/admin/candidates", label: "Candidatos" }, { href: "/admin/participations", label: "Seguimiento" }, { href: "/account", label: "Cuenta" }]}>
    <Form method="get" requirements={[{ names: ["from", "to"], rule: "date-order", message: "La fecha Hasta debe ser igual o posterior a Desde." }]} className="mb-6 flex flex-wrap items-end gap-4 rounded border bg-white p-4">
      <Field>Desde<input className="mt-1 block rounded border p-2" name="from" type="date" required max={today} defaultValue={typeof raw.from === "string" ? raw.from : `${today.slice(0, 7)}-01`} /></Field>
      <Field>Hasta<input className="mt-1 block rounded border p-2" name="to" type="date" required max={today} defaultValue={typeof raw.to === "string" ? raw.to : today} /></Field>
      <Field>Categoría<select className="mt-1 block max-w-full rounded border p-2" name="category" defaultValue={parsed.success ? (parsed.data.category ? categoryReferences[parsed.data.category] : "") ?? "" : ""}>
        <option value="">Todas las categorías</option>{categories.map((c) => <option key={c.id} value={categoryReferences[c.id]}>{c.name} ({c.code}, v{c.version})</option>)}
      </select></Field><button className="rounded bg-blue-800 px-4 py-2 text-white" type="submit">Aplicar filtros</button>
    </Form>
    <details className="mb-6 space-y-2 rounded border border-border bg-card p-4">
      <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Más información sobre las métricas</summary>
      <p>Candidato activo: perfil activo, disponible, con consentimiento vigente y confirmado durante los últimos seis meses; no exige CV.</p>
      <p>Candidatos, empresas y ofertas: foto al cierre del período. Hoy se muestra la foto hasta el momento de consulta, sin predecir el futuro. Fechas en Argentina.</p>
      <p>Participaciones, preentrevistas registradas, derivaciones y resultados: eventos dentro del período. Las empresas no se filtran por categoría.</p>
      <p>Primera contratación y cobertura total: días desde la publicación hasta la confirmación administrativa de la primera persona y de todas las vacantes, respectivamente. Incluye ofertas publicadas en el período aunque contraten después. La cobertura incompleta queda pendiente.</p>
    </details>
    {error && <FeedbackMessage tone="error">{error}</FeedbackMessage>}
    {result && <>
      <p className="mb-4">Foto al {formatFunesDateTime(result.as_of)}.</p>
      <div className="mb-6 flex flex-wrap gap-3">
        <RecordAnchor href={`/api/admin/exports/operations.csv?${metricsQuery(result.filters)}`} className="inline-block rounded bg-blue-800 px-4 py-2 text-white">Descargar CSV filtrado</RecordAnchor>
        <RecordAnchor href={`/api/admin/exports/operations.pdf?${metricsQuery(result.filters)}`} className="inline-block rounded bg-blue-800 px-4 py-2 text-white">Descargar PDF filtrado</RecordAnchor>
        <RecordAnchor href={`/api/admin/exports/operations.xlsx?${metricsQuery(result.filters)}`} className="inline-block rounded bg-blue-800 px-4 py-2 text-white">Descargar Excel filtrado</RecordAnchor>
      </div>
      <Dashboard key={metricsQuery(result.filters)} rows={result.rows} />
    </>}
  </AdminShell>;
}
