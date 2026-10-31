import { cloneElement } from "react";
import { WorkflowSteps } from "@/components/ui/workflow-steps";
import { companyOpeningWorkflow } from "@/domain/presentation/workflow-steps";
import { pageRecordIdentifier } from "@/lib/records/page-references";
import { notFound } from "next/navigation";
import { CompanyShell } from "../../../_components/company-shell";
import styles from "../../../_components/company-forms.module.css";
import { requireActiveAccount } from "@/lib/auth/guards";
import { listCompanyCategories, listCompanyOffers } from "@/features/openings/company-service";
import { getCompanyWorkspace } from "@/features/companies/service";
import { CompanyOpeningForm } from "@/features/openings/components/company/company-opening-form";
import { CompanyOpeningReferrals } from "@/features/referrals/components/company-opening-referrals";

export const dynamic = "force-dynamic";
export default async function CompanyOpeningPage({ params, searchParams }: { params: Promise<{ openingId: string }>; searchParams?: Promise<{ referral?: string }> }) {
  const { user } = await requireActiveAccount(["company"]);
  const { openingId: reference } = await params;
  const query = (await searchParams) ?? {};
  if (query.referral !== undefined && typeof query.referral !== "string") notFound();
  const openingId = await pageRecordIdentifier("opening", reference, `/empresa/ofertas/${reference}`, query);
  const [categories, offers, workspace] = await Promise.all([listCompanyCategories(), listCompanyOffers(1, openingId), getCompanyWorkspace()]);
  const opening = offers.items[0];
  if (!opening) notFound();
  const referrals = workspace.profile?.status === "active"
    ? await CompanyOpeningReferrals({ openingId, requestedReference: query.referral })
    : <section id="derivaciones" aria-labelledby="company-referrals-title" className="mt-8 space-y-4">
      <h2 id="company-referrals-title" className="text-xl font-semibold">Candidatos derivados</h2>
      <p>Completá y guardá el perfil de tu empresa para consultar las derivaciones. Los accesos anteriores no se restablecen automáticamente.</p>
    </section>;
  const guidance = companyOpeningWorkflow(opening.status);
  return <CompanyShell name={workspace.profile?.legalName} email={user.email} active="/empresa/ofertas" title={opening.title || "Borrador de oferta"}>
    <section aria-label="Próximo paso de la oferta" className="mb-6 rounded-lg border border-border p-5">
      <WorkflowSteps label="Etapas de la oferta" steps={guidance.steps} />
      <p>{guidance.description}</p>
      {guidance.target && <a href={guidance.target} className="inline-flex min-h-11 items-center text-primary underline">Continuar con el próximo paso</a>}
    </section>
    <div id="offer-management" tabIndex={-1} className={`${styles.forms} ${styles.workspace} scroll-mt-24`}><CompanyOpeningForm opening={opening} categories={categories} /></div>
    <div className={`${styles.forms} ${styles.referral}`}>{cloneElement(referrals, { tabIndex: -1, className: "mt-8 scroll-mt-24 space-y-4" })}</div>
  </CompanyShell>;
}
