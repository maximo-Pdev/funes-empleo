import { KeyRound } from "lucide-react";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { AuthSurface as AuthPage } from "../_components/auth-surface";
export default function RecoveryPage() {
  return <AuthPage icon={KeyRound} title="Recuperar acceso"><p className="text-sm leading-7 text-muted-foreground">Ingresá tu correo para solicitar un enlace. La respuesta no confirma si existe una cuenta.</p><AuthForm mode="recovery" /></AuthPage>;
}
