import Link from "next/link";
import { RoleShell } from "@/components/layouts";
import { requireActiveAccount } from "@/lib/auth/guards";
import { COMPANY_PROFILE_STATUSES, companyProfileStatusSchema } from "@/domain/states";

export const dynamic = "force-dynamic";
export default async function AdminCompaniesPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const { client } = await requireActiveAccount(["admin"]);
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const status = params.status ? companyProfileStatusSchema.safeParse(params.status) : null;
  const invalid = !Number.isInteger(page) || page < 1 || page > 1000 || (status && !status.success);
  let query = client.from("company_profiles").select("id,legal_name,status,version,account_id,archived_at", { count: "exact" })
    .order("created_at", { ascending: false }).order("id");
  if (status?.success) query = query.eq("status", status.data);
  const result = invalid ? null : await query.range((page - 1) * 10, page * 10 - 1);
  const pageUrl = (target: number) => `/admin/empresas?${new URLSearchParams({page:String(target), ...(status?.success ? {status:status.data} : {})})}`;
  const labels = { incomplete: "Incompleta", active: "Activa", suspended: "Suspendida", archived: "Archivada" };
  return <RoleShell role="admin" title="Empresas" navigation={[{ href: "/admin/openings", label: "Ofertas" }, { href: "/admin/candidates", label: "Candidatos" }, { href: "/account", label: "Mi cuenta" }]}>
    <form method="get" className="mb-5 flex flex-wrap items-end gap-3 rounded border bg-white p-4">
      <label>Estado de la empresa<select name="status" defaultValue={status?.success ? status.data : ""} className="block min-h-11 rounded border p-2">
        <option value="">Todos</option>{COMPANY_PROFILE_STATUSES.map(value=><option key={value} value={value}>{labels[value]}</option>)}
      </select></label><button className="rounded bg-blue-800 px-4 py-3 text-white">Filtrar empresas</button>
    </form>
    {invalid && <p role="alert">Revisá el estado o la página solicitada.</p>}
    {result && <><h2 className="mb-4 text-xl font-semibold">Empresas: {result.count ?? 0}</h2>
    {result.error ? <p role="alert">No se pudo cargar la lista. Recargá la página.</p> : result.data?.length === 0 ? <p>No hay empresas en esta página.</p> :
      <ul className="grid gap-3">{result.data?.map((company) => <li key={company.id} className="rounded border bg-white p-4">
        <Link href={`/admin/empresas/${company.id}`} className="text-blue-800 underline">{company.legal_name || "Empresa incompleta"}</Link>
        <p>Estado: {labels[company.status]}{company.archived_at ? " · archivada" : ""}</p>
      </li>)}</ul>}
    <nav aria-label="Páginas de empresas" className="mt-5 flex gap-4">
      {page > 1 && <Link href={pageUrl(page - 1)} className="text-blue-800 underline">Anterior</Link>}
      <span>Página {page} de {Math.max(1,Math.ceil((result.count ?? 0)/10))}</span>
      {page * 10 < (result.count ?? 0) && <Link href={pageUrl(page + 1)} className="text-blue-800 underline">Siguiente</Link>}
    </nav>
    </>}
  </RoleShell>;
}
