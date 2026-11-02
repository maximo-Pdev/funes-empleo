import { LockKeyhole } from "lucide-react";
import { requireActiveAccount } from "@/lib/auth/guards";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { AuthSurface as AuthPage } from "../_components/auth-surface";
import { getSiteAccess } from "@/features/accounts/navigation";
export const dynamic = "force-dynamic";
export default async function UpdatePasswordPage() {
  await requireActiveAccount();
  const { panel } = await getSiteAccess();
  return <AuthPage panel={panel} icon={LockKeyhole} title="Actualizar contraseña"><AuthForm mode="password" /></AuthPage>;
}
