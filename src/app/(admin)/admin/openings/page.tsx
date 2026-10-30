import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { RecordLink as Link } from "@/components/ui/record-link";
import { openingStatusLabels, displayLabel } from "@/domain/presentation/labels";
import { openingStatusTones, statusTone } from "@/domain/presentation/status-tone";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { Badge, Button, EmptyState, FeedbackMessage, Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui";
import { OPENING_STATUSES, openingStatusSchema } from "@/domain/states";
import { listAdminOpenings } from "@/features/openings/admin-service";
import { requireActiveAccount } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminOpeningsPage({ searchParams }: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { user } = await requireActiveAccount(["admin"]);
  const params = await searchParams;
  const status = params.status ? openingStatusSchema.safeParse(params.status) : null;
  const page = Number(params.page ?? 1);
  const invalid = (status && (!status.success || status.data === "draft")) || !Number.isInteger(page) || page < 1 || page > 1000;
  const result = !invalid ? await listAdminOpenings({ status: status?.success ? status.data : undefined, page, pageSize: 10 }) : null;
  const urlForPage = (target: number) => `/admin/openings?${new URLSearchParams({
    ...(status?.success ? { status: status.data } : {}), page: String(target),
  })}`;
  const outOfRange = result !== null && result.total > 0 && result.page > result.pageCount;

  return <AdminShell email={user?.email} active="/admin/openings" title="Ofertas para la Oficina" description="Moderación y seguimiento de ofertas con historial de decisiones."
    navigation={[{ href: "/admin/candidates", label: "Candidatos" }, { href: "/admin/participations", label: "Participaciones" }, { href: "/account", label: "Cuenta" }]}>
    <Form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-300 bg-white p-5">
      <div className="space-y-1"><Field className="block font-semibold" label={<>Estado de la oferta</>}><select id="opening-status" name="status" defaultValue={status?.success ? status.data : ""} className="min-h-11 rounded-md border border-slate-500 px-3">
          <option value="">Todos</option>
          {OPENING_STATUSES.filter(value => value !== "draft").map((value) => <option key={value} value={value}>{displayLabel(openingStatusLabels, value)}</option>)}
        </select></Field></div>
      <Button type="submit">Filtrar ofertas</Button>
    </Form>
    {invalid && <div className="mt-5"><FeedbackMessage tone="error">Revisá el estado o la página solicitada.</FeedbackMessage></div>}
    {result && <section className="mt-8 space-y-4" aria-label="Listado de ofertas">
      <h2 className="text-xl font-semibold">Ofertas: {result.total}</h2>
      {outOfRange ? <div className="space-y-3"><EmptyState title="Página sin ofertas" description="La página solicitada está fuera del listado actual." /><Link href={urlForPage(1)} className="font-semibold underline">Volver a la primera página</Link></div> : result.items.length === 0 ? <EmptyState title="Sin ofertas" description="No hay ofertas con estos filtros." /> :
        <ul className="space-y-3">{result.items.map((opening) => <li key={opening.id} className="rounded-lg border border-slate-300 bg-white p-4">
          <Link href={`/admin/openings/${opening.id}`} className="font-semibold text-blue-800 underline">{opening.title ?? "Oferta sin título"}</Link>
          <p className="flex flex-wrap items-center gap-2 text-sm text-slate-700">{opening.company_profiles?.legal_name ?? "Empresa sin nombre"} <Badge variant="status" tone={statusTone(openingStatusTones, opening.status)}>{displayLabel(openingStatusLabels, opening.status)}</Badge></p>
        </li>)}</ul>}
      {!outOfRange && result.pageCount > 1 && <Pagination aria-label="Páginas de ofertas">
        <PaginationContent>
          {result.page > 1 && <PaginationItem><PaginationPrevious href={urlForPage(result.page - 1)} /></PaginationItem>}
          <PaginationItem><span className="px-3 text-sm">Página {result.page} de {result.pageCount}</span></PaginationItem>
          {result.page < result.pageCount && <PaginationItem><PaginationNext href={urlForPage(result.page + 1)} /></PaginationItem>}
        </PaginationContent>
      </Pagination>}
    </section>}
  </AdminShell>;
}
