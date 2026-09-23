import { AuthForm } from "@/features/accounts/components/auth-form";
import { AuthPage } from "@/features/accounts/components/auth-page";
export default function VerificationPage() {
  return <AuthPage title="Verificación pendiente"><p className="mt-4">Revisá el enlace enviado a tu correo. Si lo necesitás, solicitá otro.</p><AuthForm mode="verification" /></AuthPage>;
}
