import Link from "next/link";
import { RoleShell } from "@/components/layouts";
import { Button, EmptyState, FeedbackMessage } from "@/components/ui";
import { PARTICIPATION_STATUSES, participationStatusSchema } from "@/domain/states";
import { listAdminParticipations } from "@/features/participations/admin-query";
import { participationStatusLabel } from "@/features/participations/components/participation-timeline";
import { requireActiveAccount } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminParticipationsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireActiveAccount(["admin"]);
  const raw = await searchParams;
  const openingId = typeof raw.openingId === "string" ? raw.openingId : undefined;
  const candidateId = typeof raw.candidateId === "string" ? raw.candidateId : undefined;
  const status = raw.status ? participationStatusSchema.safeParse(raw.status) : null;
  const page = typeof raw.page === "string" ? Number(raw.page) : raw.page === undefined ? 1 : NaN;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const invalid = (status && !status.success) || !Number.isInteger(page) || page < 1 || page > 1000 ||
    (raw.openingId !== undefined && (!openingId || !uuid.test(openingId))) ||
    (raw.candidateId !== undefined && (!candidateId || !uuid.test(candidateId)));
  const result = !invalid ? await listAdminParticipations({
    openingId, candidateId,
    status: status?.success ? status.data : undefined, page,
  }) : null;
  const pageHref = (target: number) => `/admin/participations?${new URLSearchParams({
    ...(openingId ? { openingId } : {}),
    ...(candidateId ? { candidateId } : {}),
    ...(status?.success ? { status: status.data } : {}), page: String(target),
  })}`;

  return <RoleShell role="admin" title="Participaciones" description="La Oficina evalúa cada caso y conserva su historial."
    navigation={[{ href: "/admin/openings", label: "Ofertas" }, { href: "/admin/candidates", label: "Candidatos" }]}>
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-300 bg-white p-5">
      {openingId && <input type="hidden" name="openingId" value={openingId} />}
      {candidateId && <input type="hidden" name="candidateId" value={candidateId} />}
      <div className="space-y-1"><label htmlFor="participation-status" className="block font-semibold">Estado</label>
        <select id="participation-status" name="status" defaultValue={status?.success ? status.data : ""} className="min-h-11 rounded-md border border-slate-500 px-3">
          <option value="">Todos</option>
          {PARTICIPATION_STATUSES.map((value) => <option key={value} value={value}>{participationStatusLabel(value)}</option>)}
        </select></div>
      <Button type="submit">Filtrar casos</Button>
    </form>
    {invalid && <div className="mt-5"><FeedbackMessage tone="error">Revisá los filtros y la página solicitada.</FeedbackMessage></div>}
    {result && <section aria-label="Listado de participaciones" className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold">Casos: {result.total}</h2>
      {result.items.length === 0 ? <EmptyState title="Sin participaciones" description="No hay casos con estos filtros." /> :
        <ul className="space-y-3">{result.items.map((item) => <li key={item.id} className="rounded-lg border border-slate-300 bg-white p-4">
          <Link href={`/admin/participations/${item.id}`} className="font-semibold text-blue-800 underline">{item.candidate_profiles?.display_name ?? "Perfil sin nombre"} · {item.job_openings?.title ?? "Oferta sin título"}</Link>
          <p className="text-sm text-slate-700">{participationStatusLabel(item.status)} · {item.origin === "admin_nomination" ? "Nominación administrativa" : "Postulación"}</p>
        </li>)}</ul>}
      {result.pageCount > 1 && <nav aria-label="Páginas de participaciones" className="flex gap-4">
        {result.page > 1 && <Link href={pageHref(result.page - 1)} className="text-blue-800 underline">Anterior</Link>}
        <span>Página {result.page} de {result.pageCount}</span>
        {result.page < result.pageCount && <Link href={pageHref(result.page + 1)} className="text-blue-800 underline">Siguiente</Link>}
      </nav>}
    </section>}
  </RoleShell>;
}
