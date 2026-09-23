import { AuthPage } from "@/features/accounts/components/auth-page";
export default function ExpiredSessionPage() {
  return <AuthPage title="Volvé a iniciar sesión"><p className="mt-4">No hay una sesión habilitada. Puede haber vencido o haberse cerrado. Iniciá sesión nuevamente para continuar.</p></AuthPage>;
}
