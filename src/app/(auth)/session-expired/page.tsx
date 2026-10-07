import { Clock3 } from "lucide-react";
import { AuthSurface as AuthPage } from "../_components/auth-surface";
export default function ExpiredSessionPage() {
  return <AuthPage icon={Clock3} title="Volvé a iniciar sesión"><p className="text-sm leading-7 text-muted-foreground">No hay una sesión habilitada. Puede haber vencido o haberse cerrado. Iniciá sesión nuevamente para continuar.</p></AuthPage>;
}
