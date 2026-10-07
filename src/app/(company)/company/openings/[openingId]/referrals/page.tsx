import { CompanyShell } from "../../../../_components/company-shell";
import styles from "../../../../_components/company-forms.module.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveAccount } from "@/lib/auth/guards";
import { AppError } from "@/lib/errors/public-error";
import { EmptyState } from "@/components/ui/page-state";
import { CompanyReferralPanel } from "@/features/referrals/components/company-referral-panel";
import { getCompanyReferral, listCompanyReferralReferences } from "@/features/referrals/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ openingId: string }>;
  searchParams: Promise<{ referral?: string }>;
};

export default async function CompanyReferralsPage({ params, searchParams }: Props) {
  await requireActiveAccount(["company"]);
  const { openingId } = await params;
  const requested = (await searchParams).referral;
  let references;
  try { references = await listCompanyReferralReferences(openingId); }
  catch (error) { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; }
  const selectedId = requested ?? references[0]?.referral_id;
  let selected = null;
  if (selectedId) {
    try { selected = await getCompanyReferral(openingId, selectedId); }
    catch (error) { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; }
  }
  return (
    <CompanyShell title="Candidatos derivados" active="/empresa/ofertas" description="Solo aparecen derivaciones de esta oferta. La Oficina de Empleo decide qué perfiles compartir y confirma los resultados finales.">
      <nav aria-label="Ruta de navegación"><Link href="/account" className="inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-primary underline underline-offset-4">Mi cuenta</Link></nav>
      {references.length === 0 ? <div className="mt-8"><EmptyState title="Todavía no hay derivaciones" description="La Oficina te avisará cuando derive candidatos para esta oferta." /></div> : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)]">
          <nav aria-label="Derivaciones de esta oferta" className="self-start rounded-xl border border-border bg-surface p-5">
            <h2 className="text-lg font-bold text-primary-900">Derivaciones</h2>
            <ul className="mt-3 space-y-2">{references.map((item) => <li key={item.referral_id}>
              <Link href={`/company/openings/${openingId}/referrals?referral=${item.referral_id}`}
                aria-current={selectedId === item.referral_id ? "page" : undefined}
                className="block min-h-11 break-words rounded-lg border border-border p-3 text-primary-700 hover:bg-secondary aria-[current=page]:border-primary aria-[current=page]:bg-secondary">
                <span className="block font-medium">{item.opening_title ?? "Oferta"}</span>
                <span className="block text-sm">{new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeZone: "America/Buenos_Aires" }).format(new Date(item.referred_at))}</span>
                <span className="block break-all text-xs">{item.referral_id}</span>
              </Link>
            </li>)}</ul>
          </nav>
          {selected && <div className={`${styles.forms} ${styles.referral}`}><CompanyReferralPanel referral={selected} openingId={openingId} /></div>}
        </div>
      )}
    </CompanyShell>
  );
}
