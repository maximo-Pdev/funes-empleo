import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, ShieldCheck } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { CompanyShell } from "../_components/company-shell";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getCompanyWorkspace } from "@/features/companies/service";
import { listCompanyOffers } from "@/features/openings/company-service";

export const dynamic = "force-dynamic";
export default async function CompanyDashboardPage() {
  await requireActiveAccount(["company"]);
  const workspace = await getCompanyWorkspace();
  if (!workspace.profile) return <CompanyShell title="Panel de empresa" active="/empresa"><p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-6 leading-7 text-amber-950">El perfil requiere revisión de la Oficina antes de continuar.</p></CompanyShell>;
  const offers = await listCompanyOffers(1);
  return <CompanyShell title="Panel de empresa" active="/empresa" description="La Oficina revisa las ofertas y decide qué candidatos deriva.">
    <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
      <Card className="p-6 sm:p-8"><Building2 className="h-7 w-7 text-primary" aria-hidden="true" /><h2 className="mt-4 break-words text-2xl font-bold text-primary-900">{workspace.profile.legalName}</h2><p className="mt-3 text-sm leading-6">Estado del perfil: <strong>{workspace.profile.status}</strong>.</p>{workspace.profile.status !== "active" && <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Completá el perfil antes de enviar nuevas ofertas.</p>}<Link href="/empresa/perfil" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary underline underline-offset-4">Ver mi perfil<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Card>
      <div className="rounded-xl bg-primary-900 p-6 text-white sm:p-8"><BriefcaseBusiness className="h-7 w-7 text-primary-400" aria-hidden="true" /><p className="mt-4 text-sm font-semibold text-white/90">Ofertas registradas</p><p className="mt-2 text-4xl font-bold">{offers.total}</p><p className="mt-4 text-sm leading-6 text-white/90">Prepará tus búsquedas y seguí la revisión municipal.</p><Link href="/empresa/ofertas" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold underline underline-offset-4">Gestionar ofertas<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
    </div>
    <section className="mt-8" aria-labelledby="recent-offers"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="recent-offers" className="text-xl font-bold text-primary-900">Ofertas recientes</h2><Link href="/empresa/ofertas" className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary underline underline-offset-4">Ver todas<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
      {offers.items.length === 0 ? <Card className="mt-4 p-8"><p className="font-semibold text-primary-900">Sin ofertas todavía.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Podés preparar tu primera búsqueda desde la sección de ofertas.</p><Link href="/empresa/ofertas" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-primary hover:bg-secondary">Ir a ofertas<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Card> : <ul className="mt-4 grid gap-3">{offers.items.slice(0, 5).map(offer => <li key={offer.id}><Card className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"><Link href={`/empresa/ofertas/${offer.id}`} className="min-w-0 break-words rounded-sm text-base font-semibold text-primary-900 underline decoration-border underline-offset-4 hover:decoration-primary">{offer.title || "Borrador sin título"}</Link><Badge variant="secondary"><span className="min-w-0 break-words">{offer.status}</span></Badge></Card></li>)}</ul>}
    </section>
    <p className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-5 text-sm leading-6"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />Cada oferta requiere revisión municipal antes de aparecer públicamente. Las empresas solo acceden a candidatos derivados a sus propias ofertas.</p>
  </CompanyShell>;
}
