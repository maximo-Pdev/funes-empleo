import { AuthForm } from "@/features/accounts/components/auth-form";
import { AuthPage } from "@/features/accounts/components/auth-page";
export default function RecoveryPage() {
  return <AuthPage title="Recuperar acceso"><p className="mt-4">Ingresá tu correo para solicitar un enlace. La respuesta no confirma si existe una cuenta.</p><AuthForm mode="recovery" /></AuthPage>;
}
