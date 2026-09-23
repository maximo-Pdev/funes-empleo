import { AuthForm } from "@/features/accounts/components/auth-form";
import { AuthPage } from "@/features/accounts/components/auth-page";
export default function InvalidRecoveryPage() {
  return <AuthPage title="Enlace de recuperación inválido o vencido"><p className="mt-4">Solicitá un enlace nuevo y abrilo una sola vez.</p><AuthForm mode="recovery" /></AuthPage>;
}
