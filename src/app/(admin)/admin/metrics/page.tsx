import { RoleShell } from "@/components/layouts";
import { FeedbackMessage } from "@/components/ui";
import { requireActiveAccount } from "@/lib/auth/guards";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { getMetrics, metricsCategories, MetricsHistoryUnavailable } from "@/features/metrics/service";
import { Dashboard } from "@/features/metrics/components/dashboard";
import { localToday, metricsFilterSchema, metricsQuery } from "@/validation/metrics";
export const dynamic = "force-dynamic";
export default async function MetricsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireActiveAccount(["admin"]);
  const raw = await searchParams;
  const today = localToday();
  const parsed = metricsFilterSchema.safeParse({ from: `${today.slice(0, 7)}-01`, to: today, ...raw });
  let result: Awaited<ReturnType<typeof getMetrics>> | null = null;
  let error: string | null = parsed.success ? null : "Revisá las fechas y la categoría. Usá un período válido, sin filtros repetidos.";
  let categories: Awaited<ReturnType<typeof metricsCategories>> = [];
  try {
    categories = await metricsCategories();
    if (parsed.success) result = await getMetrics(parsed.data);
  } catch (e) {
    error = e instanceof MetricsHistoryUnavailable ? `No hay evidencia histórica suficiente para ese período. ${e.message ? `El historial fiable comienza el ${new Date(e.message).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires" })}; elegí fechas desde el día siguiente.` : "Elegí un período posterior al inicio del historial."} No se sustituyen datos históricos por valores actuales.` : publicErrorFrom(e).message;
  }
  return <RoleShell role="admin" title="Métricas operativas" description="Información interna de la Oficina de Empleo. No es un informe oficial municipal o provincial."
    navigation={[{ href: "/admin/candidates", label: "Candidatos" }, { href: "/admin/participations", label: "Seguimiento" }, { href: "/account", label: "Mi cuenta" }]}>
    <form method="get" className="mb-6 flex flex-wrap items-end gap-4 rounded border bg-white p-4">
      <label>Desde<input className="mt-1 block rounded border p-2" name="from" type="date" required max={today} defaultValue={parsed.success ? parsed.data.from : ""} /></label>
      <label>Hasta<input className="mt-1 block rounded border p-2" name="to" type="date" required max={today} defaultValue={parsed.success ? parsed.data.to : ""} /></label>
      <label>Categoría<select className="mt-1 block max-w-full rounded border p-2" name="category" defaultValue={parsed.success ? parsed.data.category ?? "" : ""}>
        <option value="">Todas las categorías</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code}, v{c.version})</option>)}
      </select></label><button className="rounded bg-blue-800 px-4 py-2 text-white" type="submit">Aplicar filtros</button>
    </form>
    <section aria-labelledby="definitions" className="mb-6 space-y-2 rounded border border-blue-300 bg-blue-50 p-4">
      <h2 id="definitions" className="font-semibold">Cómo se calculan</h2>
      <p>Candidato activo: perfil activo, disponible, con consentimiento vigente y confirmado durante los últimos seis meses; no exige CV.</p>
      <p>Candidatos, empresas y ofertas: foto al cierre del período. Hoy se muestra la foto hasta el momento de consulta, sin predecir el futuro. Fechas en Argentina.</p>
      <p>Participaciones, preentrevistas registradas, derivaciones y resultados: eventos dentro del período. Las empresas no se filtran por categoría.</p>
      <p>Primera contratación y cobertura total: días desde la publicación hasta la confirmación administrativa de la primera persona y de todas las vacantes, respectivamente. Incluye ofertas publicadas en el período aunque contraten después. La cobertura incompleta queda pendiente.</p>
    </section>
    {error && <FeedbackMessage tone="error">{error}</FeedbackMessage>}
    {result && <>
      <p className="mb-4">Foto al {new Date(result.as_of).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires" })}.</p>
      <a href={`/api/admin/exports/operations.csv?${metricsQuery(result.filters)}`} className="mb-6 inline-block rounded bg-blue-800 px-4 py-2 text-white">Descargar CSV filtrado</a>
      <Dashboard rows={result.rows} />
    </>}
  </RoleShell>;
}
