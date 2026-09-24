import Link from "next/link";
import { RoleShell } from "@/components/layouts";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getCompanyWorkspace } from "@/features/companies/service";
import { companyNavigation } from "@/features/companies/navigation";
import { listCompanyOffers } from "@/features/openings/company-service";

export const dynamic = "force-dynamic";
export default async function CompanyDashboardPage() {
  await requireActiveAccount(["company"]);
  const workspace = await getCompanyWorkspace();
  if (!workspace.profile) return <RoleShell role="company" title="Panel de empresa" navigation={companyNavigation}>
    <p role="alert">El perfil requiere revisión de la Oficina antes de continuar.</p></RoleShell>;
  const offers = await listCompanyOffers(1);
  return <RoleShell role="company" title="Panel de empresa" navigation={companyNavigation}
    description="La Oficina revisa las ofertas y decide qué candidatos deriva.">
    <section className="rounded border bg-white p-5"><h2 className="text-xl font-semibold">{workspace.profile.legalName}</h2>
      <p>Estado del perfil: {workspace.profile.status}. Ofertas registradas: {offers.total}.</p>
      {workspace.profile.status !== "active" && <p>Completá el perfil antes de enviar nuevas ofertas.</p>}
      <Link href="/empresa/perfil" className="text-blue-800 underline">Ver mi perfil</Link>
    </section>
    <section className="mt-6 rounded border bg-white p-5"><h2 className="text-xl font-semibold">Ofertas recientes</h2>
      {offers.items.length === 0 ? <p>Sin ofertas todavía.</p> : <ul className="mt-3 grid gap-2">{offers.items.slice(0, 5).map((offer) =>
        <li key={offer.id}><Link href={`/empresa/ofertas/${offer.id}`} className="text-blue-800 underline">{offer.title || "Borrador sin título"}</Link> · {offer.status}</li>)}</ul>}
      <Link href="/empresa/ofertas" className="mt-3 inline-block text-blue-800 underline">Gestionar ofertas</Link>
    </section>
  </RoleShell>;
}
