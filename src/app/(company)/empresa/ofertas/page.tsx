import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarDays, MessageSquare, Plus } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { CompanyShell } from "../../_components/company-shell";
import { requireActiveAccount } from "@/lib/auth/guards";
import { listCompanyOffers } from "@/features/openings/company-service";

export const dynamic = "force-dynamic";
export default async function CompanyOffersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireActiveAccount(["company"]);
  const requested = Number((await searchParams).page ?? "1");
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;
  const offers = await listCompanyOffers(page);
  return <CompanyShell title="Mis ofertas" active="/empresa/ofertas" description="Prepará borradores y seguí cada decisión municipal. Solo las ofertas aprobadas aparecen públicamente.">
    <div className="flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-muted-foreground">{offers.total} ofertas registradas</p><Link className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700" href="/empresa/ofertas/nueva"><Plus className="h-4 w-4" aria-hidden="true" />Nueva oferta</Link></div>
    {offers.items.length === 0 ? <Card className="mt-6 p-8 text-center sm:p-12"><BriefcaseBusiness className="mx-auto h-10 w-10 text-primary" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold text-primary-900">Todavía no hay ofertas en esta página.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Creá un borrador para preparar tu búsqueda laboral.</p></Card> :
      <ul className="mt-6 grid gap-5 md:grid-cols-2">{offers.items.map(offer => <li key={offer.id} className="min-w-0"><Card className="h-full p-6"><Badge variant="secondary"><span className="min-w-0 break-words">{offer.status}</span></Badge><h2 className="mt-4 break-words text-xl font-bold leading-7"><Link className="rounded-sm text-primary-900 underline decoration-border underline-offset-4 hover:decoration-primary" href={`/empresa/ofertas/${offer.id}`}>{offer.title || "Borrador sin título"}</Link></h2><p className="mt-4 flex items-start gap-2 text-sm leading-6 text-muted-foreground"><CalendarDays className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Cierre: {offer.closingDate ?? "sin definir"}.</p>
        {offer.history.at(-1)?.message && <div className="mt-5 rounded-lg border border-border bg-surface-muted p-4"><p className="flex items-center gap-2 text-sm font-semibold text-primary-900"><MessageSquare className="h-4 w-4" aria-hidden="true" />Mensaje de la Oficina</p><p className="mt-2 break-words text-sm leading-6">{offer.history.at(-1)?.message}</p></div>}
      </Card></li>)}</ul>}
    <nav aria-label="Páginas de ofertas" className="mt-6 flex flex-wrap items-center justify-between gap-3">
      {page > 1 && <Link href={`/empresa/ofertas?page=${page - 1}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-primary hover:bg-secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Anterior</Link>}
      <p className="text-sm text-muted-foreground">Página {page}</p>
      {page * offers.pageSize < offers.total && <Link href={`/empresa/ofertas?page=${page + 1}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-primary hover:bg-secondary">Siguiente<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
    </nav>
  </CompanyShell>;
}
