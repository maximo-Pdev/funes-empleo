import Link from "next/link";
import { RoleShell } from "@/components/layouts";
import { requireActiveAccount } from "@/lib/auth/guards";
import { companyNavigation } from "@/features/companies/navigation";
import { listCompanyOffers } from "@/features/openings/company-service";

export const dynamic = "force-dynamic";
export default async function CompanyOffersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireActiveAccount(["company"]);
  const requested = Number((await searchParams).page ?? "1");
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;
  const offers = await listCompanyOffers(page);
  return <RoleShell role="company" title="Mis ofertas" navigation={companyNavigation}
    description="Prepará borradores y seguí cada decisión municipal. Solo las ofertas aprobadas aparecen públicamente.">
    <Link className="inline-block rounded bg-blue-800 p-3 text-white" href="/empresa/ofertas/nueva">Nueva oferta</Link>
    {offers.items.length === 0 ? <p className="mt-6">Todavía no hay ofertas en esta página.</p> :
      <ul className="mt-6 grid gap-4">{offers.items.map((offer) => <li key={offer.id} className="rounded border bg-white p-4">
        <h2 className="text-lg font-semibold"><Link className="text-blue-800 underline" href={`/empresa/ofertas/${offer.id}`}>{offer.title || "Borrador sin título"}</Link></h2>
        <p>Estado: {offer.status}. Cierre: {offer.closingDate ?? "sin definir"}.</p>
        {offer.history.at(-1)?.message && <p>Mensaje de la Oficina: {offer.history.at(-1)?.message}</p>}
      </li>)}</ul>}
    <nav aria-label="Páginas de ofertas" className="mt-5 flex gap-4">
      {page > 1 && <Link href={`/empresa/ofertas?page=${page - 1}`} className="text-blue-800 underline">Anterior</Link>}
      {page * offers.pageSize < offers.total && <Link href={`/empresa/ofertas?page=${page + 1}`} className="text-blue-800 underline">Siguiente</Link>}
    </nav>
  </RoleShell>;
}
