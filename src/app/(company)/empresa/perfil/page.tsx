import { CompanyShell } from "../../_components/company-shell";
import styles from "../../_components/company-forms.module.css";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getCompanyWorkspace } from "@/features/companies/service";
import { CompanyProfileForm } from "@/features/companies/components/company-profile-form";

export const dynamic = "force-dynamic";
export default async function CompanyProfilePage() {
  await requireActiveAccount(["company"]);
  const workspace = await getCompanyWorkspace();
  return <CompanyShell active="/empresa/perfil" title="Perfil de empresa">
    {workspace.profile ? <div className={`${styles.forms} ${styles.workspace}`}><CompanyProfileForm profile={workspace.profile} accountVersion={workspace.account.version} /></div> :
      <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-6 leading-7 text-amber-950">No se pudo completar el perfil. {workspace.bootstrap === "duplicate_or_invalid" ? "El CUIT o los datos requieren revisión de la Oficina." : "Contactá a la Oficina para completar el registro."}</p>}
  </CompanyShell>;
}
