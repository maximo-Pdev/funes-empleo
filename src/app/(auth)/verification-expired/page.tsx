import { MailWarning } from "lucide-react";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { AuthSurface as AuthPage } from "../_components/auth-surface";
export default function ExpiredVerificationPage() {
  return <AuthPage icon={MailWarning} title="Enlace de verificación inválido o vencido"><p className="text-sm leading-7 text-muted-foreground">Solicitá un enlace nuevo. No es necesario crear otra cuenta.</p><AuthForm mode="verification" /></AuthPage>;
}
