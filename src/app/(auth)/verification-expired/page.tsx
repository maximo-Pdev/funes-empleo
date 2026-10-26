import { MailWarning } from "lucide-react";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { AccessNotice } from "@/features/accounts/components/access-notice";
import { AuthSurface as AuthPage } from "../_components/auth-surface";
export default function ExpiredVerificationPage() {
  return <AuthPage icon={MailWarning} title="Enlace de verificación inválido o vencido"
    description="El enlace ya se usó o venció por seguridad.">
    <AccessNotice tone="alert" icon={MailWarning}>Solicitá un enlace nuevo. No es necesario crear otra cuenta.</AccessNotice>
    <AuthForm mode="verification" homepageLayout />
  </AuthPage>;
}
