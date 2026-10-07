import { CompanyShell } from "../../../_components/company-shell";
import styles from "../../../_components/company-forms.module.css";
import { requireActiveAccount } from "@/lib/auth/guards";
import { listCompanyCategories } from "@/features/openings/company-service";
import { CompanyOpeningForm } from "@/features/openings/components/company/company-opening-form";

export const dynamic = "force-dynamic";
export default async function NewCompanyOpeningPage() {
  await requireActiveAccount(["company"]);
  const categories = await listCompanyCategories();
  return <CompanyShell active="/empresa/ofertas" title="Nueva oferta"
    description="Guardá el borrador y enviá la oferta a revisión municipal cuando esté completa.">
    <div className={`${styles.forms} ${styles.workspace}`}><CompanyOpeningForm opening={null} categories={categories} /></div>
  </CompanyShell>;
}
