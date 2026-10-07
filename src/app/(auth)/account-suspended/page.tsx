import { ShieldAlert } from "lucide-react";
import { AuthSurface as AuthPage } from "../_components/auth-surface";
export default function SuspendedPage() {
  return <AuthPage icon={ShieldAlert} title="Acceso suspendido"><p className="text-sm leading-7 text-muted-foreground">Contactá a la Oficina de Empleo para consultar tu situación. Esta pantalla no muestra motivos internos.</p></AuthPage>;
}
