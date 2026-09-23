import { AuthForm } from "@/features/accounts/components/auth-form";
import { AuthPage } from "@/features/accounts/components/auth-page";
export default function ExpiredVerificationPage() {
  return <AuthPage title="Enlace de verificación inválido o vencido"><p className="mt-4">Solicitá un enlace nuevo. No es necesario crear otra cuenta.</p><AuthForm mode="verification" /></AuthPage>;
}
