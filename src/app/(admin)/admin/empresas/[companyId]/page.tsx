import { pageRecordIdentifier } from "@/lib/records/page-references";
import { recordReference } from "@/lib/records/references";
import { RecordLink as Link } from "@/components/ui/record-link";
import { accountStatusLabels, companyProfileStatusLabels, openingStatusLabels, displayLabel } from "@/domain/presentation/labels";
import { accountStatusTones, companyProfileStatusTones, openingStatusTones, statusTone } from "@/domain/presentation/status-tone";
import { Badge, EmptyState, FeedbackMessage, Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui";
import { notFound } from "next/navigation";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { requireActiveAccount } from "@/lib/auth/guards";
import { AdminCompanyDecision } from "@/features/companies/components/admin-company-decision";

export const dynamic = "force-dynamic";
export default async function AdminCompanyPage({ params, searchParams = Promise.resolve({}) }: {
  params: Promise<{ companyId: string }>;
  searchParams?: Promise<{ page?: string | string[] }>;
}) {
  const { client, user } = await requireActiveAccount(["admin"]);
  const { companyId: reference } = await params;
  const query = await searchParams;
  const companyId = await pageRecordIdentifier("company", reference, `/admin/empresas/${reference}`, query);
  const rawPage = query.page ?? "1";
  const page = typeof rawPage === "string" && /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : NaN;
  const invalidPage = !Number.isSafeInteger(page) || page < 1 || page > 1000;
  const profile = await client.from("company_profiles")
    .select("id,account_id,legal_name,cuit_display,responsible_name,email,phone,activity,locality,status,archived_at,version")
    .eq("id", companyId).maybeSingle();
  if (profile.error || !profile.data) notFound();
  const [account, offers] = await Promise.all([
    client.from("accounts").select("id,status,version").eq("id", profile.data.account_id).single(),
    invalidPage ? null : client.from("job_openings").select("id,title,status,archived_at", { count: "exact" })
      .eq("company_id", companyId).neq("status", "draft").order("created_at", { ascending: false }).order("id")
      .range((page - 1) * 10, page * 10 - 1),
  ]);
  const rangeError = offers?.error?.code === "PGRST103";
  if (account.error || !account.data || (offers?.error && !rangeError)) notFound();
  const command = account.data.status === "suspended" ? "reactivate" : account.data.status === "archived" ? "restore" : "suspend";
  const companyReference = await recordReference("company", profile.data.id);
  const pageUrl = (target: number) => `/admin/empresas/${companyReference}?page=${target}`;
  let total = offers?.count ?? 0;
  if (rangeError) {
    const count = await client.from("job_openings").select("id", { count: "exact", head: true })
      .eq("company_id", companyId).neq("status", "draft");
    if (count.error) notFound();
    total = count.count ?? 0;
  }
  const items = offers?.data ?? [];
  const pageCount = Math.ceil(total / 10);
  const outOfRange = total > 0 && page > pageCount;
  const fields = [
    ["Razón social", profile.data.legal_name], ["CUIT", profile.data.cuit_display],
    ["Responsable", profile.data.responsible_name], ["Correo electrónico", profile.data.email],
    ["Teléfono", profile.data.phone], ["Actividad", profile.data.activity], ["Localidad", profile.data.locality],
  ];

  return <AdminShell email={user?.email} active="/admin/empresas" title={profile.data.legal_name || "Empresa incompleta"}
    navigation={[{ href: "/admin/empresas", label: "Empresas" }, { href: "/admin/openings", label: "Ofertas" }]}>
    <div className="flex flex-wrap items-center gap-2">Cuenta <Badge variant="status" tone={statusTone(accountStatusTones, account.data.status)}>{displayLabel(accountStatusLabels, account.data.status)}</Badge> Perfil <Badge variant="status" tone={statusTone(companyProfileStatusTones, profile.data.status)}>{displayLabel(companyProfileStatusLabels, profile.data.status)}</Badge> {profile.data.archived_at ? "Archivada." : ""}</div>
    <section aria-labelledby="company-profile" className="mt-6 rounded-lg border border-border bg-surface p-5">
      <h2 id="company-profile" className="text-xl font-semibold">Perfil de la empresa</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="min-w-0">
        <dt className="font-semibold">{label}</dt><dd className="mt-1 break-words">{value?.trim() || "Sin informar"}</dd>
      </div>)}</dl>
    </section>
    <p className="mt-4">Una reactivación deja el perfil incompleto. Restaurar deja las ofertas archivadas en borrador; ninguna decisión recupera accesos revocados.</p>
    <h2 className="mt-6 text-xl font-semibold">Gestión de acceso</h2>
    <AdminCompanyDecision accountId={account.data.id} version={account.data.version} command={command} />
    {account.data.status !== "archived" && <AdminCompanyDecision accountId={account.data.id} version={account.data.version} command="archive" />}
    <section aria-labelledby="company-offers" className="mt-8 space-y-4">
      <h2 id="company-offers" className="text-xl font-semibold">Ofertas de la empresa{offers ? `: ${total}` : ""}</h2>
      {invalidPage ? <FeedbackMessage tone="error">Revisá la página solicitada.</FeedbackMessage> : outOfRange ? <div className="space-y-3">
        <EmptyState title="Página sin ofertas" description="La página solicitada está fuera del listado actual." />
        <Link href={pageUrl(1)} className="font-semibold underline">Volver a la primera página</Link>
      </div> : items.length === 0 ? <EmptyState title="Sin ofertas" description="La empresa no tiene ofertas para mostrar." /> : <ul className="grid gap-3">{items.map(offer => <li key={offer.id} className="rounded-lg border border-border bg-surface p-4">
        <Link href={`/admin/openings/${offer.id}`} className="font-semibold underline">{offer.title || "Oferta sin título"}</Link> <Badge variant="status" tone={statusTone(openingStatusTones, offer.status)}>{displayLabel(openingStatusLabels, offer.status)}</Badge>{offer.archived_at ? " · archivada" : ""}
      </li>)}</ul>}
      {!invalidPage && !outOfRange && pageCount > 1 && <Pagination aria-label="Páginas de ofertas de la empresa">
        <PaginationContent>
          {page > 1 && <PaginationItem><PaginationPrevious href={pageUrl(page - 1)} /></PaginationItem>}
          <PaginationItem><span className="px-3 text-sm">Página {page} de {pageCount}</span></PaginationItem>
          {page < pageCount && <PaginationItem><PaginationNext href={pageUrl(page + 1)} /></PaginationItem>}
        </PaginationContent>
      </Pagination>}
    </section>
  </AdminShell>;
}
