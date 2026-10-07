import { LogOut } from "lucide-react";
import { logoutAction } from "@/features/accounts/actions";
import { AuthSurface as AuthPage } from "../_components/auth-surface";
export default function LogoutPage() {
  return <AuthPage icon={LogOut} title="Cerrar sesión"><p className="mb-5 text-sm leading-7 text-muted-foreground">Confirmá para cerrar tu sesión en el portal.</p><form action={logoutAction}><button className="mt-6 rounded bg-blue-800 p-3 text-white">Confirmar cierre de sesión</button></form></AuthPage>;
}
