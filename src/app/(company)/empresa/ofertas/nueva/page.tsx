import { CompanyShell } from "../../../_components/company-shell";
import styles from "../../../_components/company-forms.module.css";
import { requireActiveAccount } from "@/lib/auth/guards";
import { listCompanyCategories } from "@/features/openings/company-service";
import { getCompanyWorkspace } from "@/features/companies/service";
import { CompanyOpeningForm } from "@/features/openings/components/company/company-opening-form";

export const dynamic = "force-dynamic";
export default async function NewCompanyOpeningPage() {
  const { user } = await requireActiveAccount(["company"]);
  const workspace = await getCompanyWorkspace();
  const categories = await listCompanyCategories();
  return <CompanyShell name={workspace.profile?.legalName} email={user.email} active="/empresa/ofertas" title="Nueva oferta"
    description="Guardá el borrador y enviá la oferta a revisión municipal cuando esté completa.">
    <div className={`${styles.forms} ${styles.workspace}`}><CompanyOpeningForm opening={null} categories={categories} /></div>
  </CompanyShell>;
}
