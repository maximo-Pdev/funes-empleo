import { RoleShell } from "@/components/layouts";
import { requireActiveAccount } from "@/lib/auth/guards";
import { companyNavigation } from "@/features/companies/navigation";
import { listCompanyCategories } from "@/features/openings/company-service";
import { CompanyOpeningForm } from "@/features/openings/components/company/company-opening-form";

export const dynamic = "force-dynamic";
export default async function NewCompanyOpeningPage() {
  await requireActiveAccount(["company"]);
  const categories = await listCompanyCategories();
  return <RoleShell role="company" title="Nueva oferta" navigation={companyNavigation}
    description="Guardá el borrador y enviá la oferta a revisión municipal cuando esté completa.">
    <CompanyOpeningForm opening={null} categories={categories} />
  </RoleShell>;
}
