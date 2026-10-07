import { MailCheck } from "lucide-react";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { AuthSurface as AuthPage } from "../_components/auth-surface";
export default function VerificationPage() {
  return <AuthPage icon={MailCheck} title="Verificación pendiente"><p className="text-sm leading-7 text-muted-foreground">Revisá el enlace enviado a tu correo. Si lo necesitás, solicitá otro.</p><AuthForm mode="verification" /></AuthPage>;
}
