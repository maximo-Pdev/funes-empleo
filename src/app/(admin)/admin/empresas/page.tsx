import Link from "next/link";
import { RoleShell } from "@/components/layouts";
import { requireActiveAccount } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export default async function AdminCompaniesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { client } = await requireActiveAccount(["admin"]);
  const requested = Number((await searchParams).page ?? "1");
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;
  const result = await client.from("company_profiles").select("id,legal_name,status,version,account_id,archived_at", { count: "exact" })
    .order("created_at", { ascending: false }).range((page - 1) * 20, page * 20 - 1);
  return <RoleShell role="admin" title="Empresas" navigation={[{ href: "/admin/openings", label: "Ofertas" }, { href: "/admin/candidates", label: "Candidatos" }, { href: "/account", label: "Mi cuenta" }]}>
    {result.error ? <p role="alert">No se pudo cargar la lista. Recargá la página.</p> : result.data?.length === 0 ? <p>No hay empresas en esta página.</p> :
      <ul className="grid gap-3">{result.data?.map((company) => <li key={company.id} className="rounded border bg-white p-4">
        <Link href={`/admin/empresas/${company.id}`} className="text-blue-800 underline">{company.legal_name || "Empresa incompleta"}</Link>
        <p>Estado: {company.status}{company.archived_at ? " · archivada" : ""}</p>
      </li>)}</ul>}
    <nav aria-label="Páginas de empresas" className="mt-5 flex gap-4">
      {page > 1 && <Link href={`/admin/empresas?page=${page - 1}`} className="text-blue-800 underline">Anterior</Link>}
      {page * 20 < (result.count ?? 0) && <Link href={`/admin/empresas?page=${page + 1}`} className="text-blue-800 underline">Siguiente</Link>}
    </nav>
  </RoleShell>;
}
