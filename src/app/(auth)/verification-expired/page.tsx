import { MailWarning } from "lucide-react";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { AccessNotice } from "@/features/accounts/components/access-notice";
import { AuthSurface as AuthPage } from "../_components/auth-surface";
import { getSiteAccess } from "@/features/accounts/navigation";
export default async function ExpiredVerificationPage() {
  const { panel } = await getSiteAccess();
  return <AuthPage panel={panel} icon={MailWarning} title="Enlace de verificación inválido o vencido"
    description="El enlace ya se usó o venció por seguridad.">
    <AccessNotice tone="alert" icon={MailWarning}>Solicitá un enlace nuevo. No es necesario crear otra cuenta.</AccessNotice>
    <AuthForm mode="verification" homepageLayout />
  </AuthPage>;
}
