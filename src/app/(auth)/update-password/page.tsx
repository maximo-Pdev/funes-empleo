import { requireActiveAccount } from "@/lib/auth/guards";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { AuthPage } from "@/features/accounts/components/auth-page";
export const dynamic = "force-dynamic";
export default async function UpdatePasswordPage() {
  await requireActiveAccount();
  return <AuthPage title="Actualizar contraseña"><AuthForm mode="password" /></AuthPage>;
}
