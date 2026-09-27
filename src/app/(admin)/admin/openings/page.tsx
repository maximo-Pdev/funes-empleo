import Link from "next/link";
import { RoleShell } from "@/components/layouts";
import { Button, EmptyState, FeedbackMessage } from "@/components/ui";
import { OPENING_STATUSES, openingStatusSchema } from "@/domain/states";
import { listAdminOpenings } from "@/features/openings/admin-service";
import { requireActiveAccount } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminOpeningsPage({ searchParams }: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireActiveAccount(["admin"]);
  const params = await searchParams;
  const status = params.status ? openingStatusSchema.safeParse(params.status) : null;
  const page = Number(params.page ?? 1);
  const invalid = (status && !status.success) || !Number.isInteger(page) || page < 1 || page > 1000;
  const result = !invalid ? await listAdminOpenings({ status: status?.success ? status.data : undefined, page, pageSize: 10 }) : null;
  const urlForPage = (target: number) => `/admin/openings?${new URLSearchParams({
    ...(status?.success ? { status: status.data } : {}), page: String(target),
  })}`;

  return <RoleShell role="admin" title="Ofertas para la Oficina" description="Moderación y seguimiento de ofertas con historial de decisiones."
    navigation={[{ href: "/admin/candidates", label: "Candidatos" }, { href: "/admin/participations", label: "Participaciones" }, { href: "/account", label: "Mi cuenta" }]}>
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-300 bg-white p-5">
      <div className="space-y-1"><label htmlFor="opening-status" className="block font-semibold">Estado de la oferta</label>
        <select id="opening-status" name="status" defaultValue={status?.success ? status.data : ""} className="min-h-11 rounded-md border border-slate-500 px-3">
          <option value="">Todos</option>
          {OPENING_STATUSES.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
        </select></div>
      <Button type="submit">Filtrar ofertas</Button>
    </form>
    {invalid && <div className="mt-5"><FeedbackMessage tone="error">Revisá el estado o la página solicitada.</FeedbackMessage></div>}
    {result && <section className="mt-8 space-y-4" aria-label="Listado de ofertas">
      <h2 className="text-xl font-semibold">Ofertas: {result.total}</h2>
      {result.items.length === 0 ? <EmptyState title="Sin ofertas" description="No hay ofertas con estos filtros." /> :
        <ul className="space-y-3">{result.items.map((opening) => <li key={opening.id} className="rounded-lg border border-slate-300 bg-white p-4">
          <Link href={`/admin/openings/${opening.id}`} className="font-semibold text-blue-800 underline">{opening.title ?? "Oferta sin título"}</Link>
          <p className="text-sm text-slate-700">{opening.company_profiles?.legal_name ?? "Empresa sin nombre"} · Estado: {opening.status.replaceAll("_", " ")}</p>
        </li>)}</ul>}
      {result.pageCount > 1 && <nav aria-label="Páginas de ofertas" className="flex gap-4">
        {result.page > 1 && <Link href={urlForPage(result.page - 1)} className="text-blue-800 underline">Anterior</Link>}
        <span>Página {result.page} de {result.pageCount}</span>
        {result.page < result.pageCount && <Link href={urlForPage(result.page + 1)} className="text-blue-800 underline">Siguiente</Link>}
      </nav>}
    </section>}
  </RoleShell>;
}
