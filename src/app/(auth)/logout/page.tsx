import { Form } from "@/components/forms/form";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/features/accounts/actions";
import { AuthSurface as AuthPage } from "../_components/auth-surface";
import { getSiteAccess } from "@/features/accounts/navigation";
export default async function LogoutPage() {
  const { panel } = await getSiteAccess();
  return <AuthPage panel={panel} icon={LogOut} title="Cerrar sesión"><p className="mb-5 text-sm leading-7 text-muted-foreground">Confirmá para cerrar tu sesión en el portal.</p><Form action={logoutAction}><button className="mt-6 rounded bg-blue-800 p-3 text-white">Confirmar cierre de sesión</button></Form></AuthPage>;
}
