import { RoleShell } from "@/components/layouts";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getCompanyWorkspace } from "@/features/companies/service";
import { CompanyProfileForm } from "@/features/companies/components/company-profile-form";
import { companyNavigation } from "@/features/companies/navigation";

export const dynamic = "force-dynamic";
export default async function CompanyProfilePage() {
  await requireActiveAccount(["company"]);
  const workspace = await getCompanyWorkspace();
  return <RoleShell role="company" title="Perfil de empresa" navigation={companyNavigation}>
    {workspace.profile ? <CompanyProfileForm profile={workspace.profile} accountVersion={workspace.account.version} /> :
      <p role="alert">No se pudo completar el perfil. {workspace.bootstrap === "duplicate_or_invalid" ? "El CUIT o los datos requieren revisión de la Oficina." : "Contactá a la Oficina para completar el registro."}</p>}
  </RoleShell>;
}
