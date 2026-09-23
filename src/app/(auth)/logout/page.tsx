import { logoutAction } from "@/features/accounts/actions";
import { AuthPage } from "@/features/accounts/components/auth-page";
export default function LogoutPage() {
  return <AuthPage title="Cerrar sesión"><form action={logoutAction}><button className="mt-6 rounded bg-blue-800 p-3 text-white">Confirmar cierre de sesión</button></form></AuthPage>;
}
