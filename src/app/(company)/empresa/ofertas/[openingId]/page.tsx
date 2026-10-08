import { notFound } from "next/navigation";
import { CompanyShell } from "../../../_components/company-shell";
import styles from "../../../_components/company-forms.module.css";
import { requireActiveAccount } from "@/lib/auth/guards";
import { listCompanyCategories, listCompanyOffers } from "@/features/openings/company-service";
import { CompanyOpeningForm } from "@/features/openings/components/company/company-opening-form";

export const dynamic = "force-dynamic";
export default async function CompanyOpeningPage({ params }: { params: Promise<{ openingId: string }> }) {
  await requireActiveAccount(["company"]);
  const { openingId } = await params;
  const [categories, offers] = await Promise.all([listCompanyCategories(), listCompanyOffers(1, openingId)]);
  const opening = offers.items[0];
  if (!opening) notFound();
  return <CompanyShell active="/empresa/ofertas" title={opening.title || "Borrador de oferta"}>
    <div className={`${styles.forms} ${styles.workspace}`}><CompanyOpeningForm opening={opening} categories={categories} /></div>
    <a className="mt-6 inline-flex min-h-12 items-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-primary hover:bg-secondary" href={`/company/openings/${opening.id}/referrals`}>Ver derivaciones de esta oferta</a>
  </CompanyShell>;
}
