import { pageRecordIdentifier } from "@/lib/records/page-references";
import { notFound } from "next/navigation";
import { CompanyShell } from "../../../_components/company-shell";
import styles from "../../../_components/company-forms.module.css";
import { requireActiveAccount } from "@/lib/auth/guards";
import { listCompanyCategories, listCompanyOffers } from "@/features/openings/company-service";
import { CompanyOpeningForm } from "@/features/openings/components/company/company-opening-form";
import { CompanyOpeningReferrals } from "@/features/referrals/components/company-opening-referrals";
import { getCompanyWorkspace } from "@/features/companies/service";

export const dynamic = "force-dynamic";
export default async function CompanyOpeningPage({ params, searchParams }: { params: Promise<{ openingId: string }>; searchParams?: Promise<{ referral?: string }> }) {
  await requireActiveAccount(["company"]);
  const { openingId: reference } = await params;
  const query = (await searchParams) ?? {};
  if (query.referral !== undefined && typeof query.referral !== "string") notFound();
  const openingId = await pageRecordIdentifier("opening", reference, `/empresa/ofertas/${reference}`, query);
  const [categories, offers, workspace] = await Promise.all([listCompanyCategories(), listCompanyOffers(1, openingId), getCompanyWorkspace()]);
  const opening = offers.items[0];
  if (!opening) notFound();
  const referrals = workspace.profile?.status === "active"
    ? await CompanyOpeningReferrals({ openingId, requestedReference: query.referral })
    : <section aria-labelledby="company-referrals-title" className="mt-8 space-y-4">
      <h2 id="company-referrals-title" className="text-xl font-semibold">Candidatos derivados</h2>
      <p>Completá y guardá el perfil de tu empresa para consultar las derivaciones. Los accesos anteriores no se restablecen automáticamente.</p>
    </section>;
  return <CompanyShell active="/empresa/ofertas" title={opening.title || "Borrador de oferta"}>
    <div className={`${styles.forms} ${styles.workspace}`}><CompanyOpeningForm opening={opening} categories={categories} /></div>
    <div className={`${styles.forms} ${styles.referral}`}>{referrals}</div>
  </CompanyShell>;
}
