import { referenceFilters } from "@/lib/records/page-references";
import { referenceUrl } from "@/lib/records/reference-url";
import { recordReference } from "@/lib/records/references";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { RecordLink as Link } from "@/components/ui/record-link";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { Badge, Button, EmptyState, FeedbackMessage, Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui";
import { PARTICIPATION_STATUSES, participationStatusSchema } from "@/domain/states";
import { participationStatusTones, statusTone } from "@/domain/presentation/status-tone";
import { listAdminParticipations } from "@/features/participations/admin-query";
import { participationStatusLabel } from "@/features/participations/components/participation-timeline";
import { requireActiveAccount } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminParticipationsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireActiveAccount(["admin"]);
  const original = await searchParams;
  const raw = await referenceFilters("/admin/participations", original, { openingId: "opening", candidateId: "candidate" });
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
  const openingReference = !invalid && openingId ? await recordReference("opening", openingId) : undefined;
  const candidateReference = !invalid && candidateId ? await recordReference("candidate", candidateId) : undefined;
  const pageHref = (target: number) => referenceUrl(`/admin/participations?${new URLSearchParams({
    ...(openingId ? { openingId } : {}),
    ...(candidateId ? { candidateId } : {}),
    ...(status?.success ? { status: status.data } : {}), page: String(target),
  })}`);

  return <AdminShell email={user?.email} active="/admin/participations" title="Participaciones" description="La Oficina evalúa cada caso y conserva su historial."
    navigation={[{ href: "/admin/openings", label: "Ofertas" }, { href: "/admin/candidates", label: "Candidatos" }]}>
    <Form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-300 bg-white p-5">
      {openingReference && <input type="hidden" name="openingId" value={openingReference} />}
      {candidateReference && <input type="hidden" name="candidateId" value={candidateReference} />}
      <div className="space-y-1"><Field className="block font-semibold" label={<>Estado</>}><select id="participation-status" name="status" defaultValue={status?.success ? status.data : ""} className="min-h-11 rounded-md border border-slate-500 px-3">
          <option value="">Todos</option>
          {PARTICIPATION_STATUSES.map((value) => <option key={value} value={value}>{participationStatusLabel(value)}</option>)}
        </select></Field></div>
      <Button type="submit">Filtrar casos</Button>
    </Form>
    {invalid && <div className="mt-5"><FeedbackMessage tone="error">Revisá los filtros y la página solicitada.</FeedbackMessage></div>}
    {result && <section aria-label="Listado de participaciones" className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold">Casos: {result.total}</h2>
      {result.items.length === 0 ? <EmptyState title="Sin participaciones" description="No hay casos con estos filtros." /> :
        <ul className="space-y-3">{result.items.map((item) => <li key={item.id} className="rounded-lg border border-slate-300 bg-white p-4">
          <Link href={`/admin/participations/${item.id}`} className="font-semibold text-blue-800 underline">{item.candidate_profiles?.display_name ?? "Perfil sin nombre"} · {item.job_openings?.title ?? "Oferta sin título"}</Link>
          <p className="flex flex-wrap items-center gap-2 text-sm text-slate-700"><Badge variant="status" tone={statusTone(participationStatusTones, item.status)}>{participationStatusLabel(item.status)}</Badge> {item.origin === "admin_nomination" ? "Nominación administrativa" : "Postulación"}</p>
        </li>)}</ul>}
      {result.pageCount > 1 && <Pagination aria-label="Páginas de participaciones">
        <PaginationContent>
          {result.page > 1 && <PaginationItem><PaginationPrevious href={await pageHref(result.page - 1)} /></PaginationItem>}
          <PaginationItem><span className="px-3 text-sm">Página {result.page} de {result.pageCount}</span></PaginationItem>
          {result.page < result.pageCount && <PaginationItem><PaginationNext href={await pageHref(result.page + 1)} /></PaginationItem>}
        </PaginationContent>
      </Pagination>}
    </section>}
  </AdminShell>;
}
