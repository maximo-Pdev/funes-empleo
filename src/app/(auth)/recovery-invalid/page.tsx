import { CircleAlert } from "lucide-react";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { AuthSurface as AuthPage } from "../_components/auth-surface";
export default function InvalidRecoveryPage() {
  return <AuthPage icon={CircleAlert} title="Enlace de recuperación inválido o vencido"><p className="text-sm leading-7 text-muted-foreground">Solicitá un enlace nuevo y abrilo una sola vez.</p><AuthForm mode="recovery" /></AuthPage>;
}
