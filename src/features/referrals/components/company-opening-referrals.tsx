import { routeIdentifier } from "@/lib/records/references";
import { RecordLink as Link, RecordLabel } from "@/components/ui/record-link";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors/public-error";
import { EmptyState } from "@/components/ui/page-state";
import { getCompanyReferral, listCompanyReferralReferences } from "../service";
import { CompanyReferralPanel } from "./company-referral-panel";

export async function CompanyOpeningReferrals({ openingId, requestedReference }: { openingId: string; requestedReference?: string }) {
  let requested: string | undefined;
  try { requested = requestedReference ? await routeIdentifier("referral", requestedReference) : undefined; }
  catch (error) { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; }
  let references;
  try { references = await listCompanyReferralReferences(openingId); }
  catch (error) { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; }
  const selectedId = requested ?? references[0]?.referral_id;
  let selected = null;
  if (selectedId) {
    try { selected = await getCompanyReferral(openingId, selectedId); }
    catch (error) { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; }
  }
  return <section id="derivaciones" aria-labelledby="company-referrals-title" className="mt-8 space-y-4">
    <h2 id="company-referrals-title" className="text-xl font-semibold">Candidatos derivados</h2>
    <p>Solo aparecen derivaciones de esta oferta. La Oficina decide qué perfiles compartir y confirma los resultados finales.</p>
    {references.length === 0 ? <EmptyState title="Todavía no hay derivaciones" description="La Oficina te avisará cuando derive candidatos para esta oferta." /> :
      <div className="grid gap-6 lg:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)]">
        <nav aria-label="Derivaciones de esta oferta" className="self-start rounded-xl border border-border bg-surface p-5">
          <h3 className="text-lg font-bold text-primary-900">Derivaciones</h3>
          <ul className="mt-3 space-y-2">{references.map(item => <li key={item.referral_id}>
            <Link href={`/empresa/ofertas/${openingId}?referral=${item.referral_id}#derivaciones`} aria-current={selectedId === item.referral_id ? "page" : undefined}
              className="block min-h-11 break-words rounded-lg border border-border p-3 text-primary-700 hover:bg-secondary aria-[current=page]:border-primary aria-[current=page]:bg-secondary">
              <span className="block font-medium">{item.opening_title ?? "Oferta"}</span>
              <span className="block text-sm">{new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeZone: "America/Buenos_Aires" }).format(new Date(item.referred_at))}</span>
              <span className="block break-all text-xs"><RecordLabel kind="referral" id={item.referral_id} /></span>
            </Link>
          </li>)}</ul>
        </nav>
        {selected && <CompanyReferralPanel referral={selected} openingId={openingId} />}
      </div>}
  </section>;
}
