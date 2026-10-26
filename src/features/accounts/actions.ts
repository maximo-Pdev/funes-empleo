"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { signIn, requestRecovery, resendVerification, updatePassword, changeAccountStatus, registerAccount } from "./service";
import type { AccountFormState } from "./form-state";
import { getAccessHref } from "./access-notices";
import type { UserRole } from "@/domain/catalogs";
import { passwordConfirmationMessage, passwordConfirmationSchema } from "@/validation/password";

const genericRenewal = { message: "Si corresponde, recibirás un enlace en tu correo. Revisá también la carpeta de correo no deseado.", success: true };

const panelHref: Record<UserRole, string> = { candidate: "/dashboard", company: "/empresa", admin: "/account" };

export async function loginAction(_previous: AccountFormState, form: FormData): Promise<AccountFormState> {
  let result: { status: "active" | "invalid" | "suspended" | "already-active"; role?: UserRole } = { status: "invalid" };
  try { result = await signIn({ email: form.get("email"), password: form.get("password") }); }
  catch { return { message: "No pudimos iniciar sesión. Revisá tus datos e intentá nuevamente.", success: false }; }
  if (result.status === "already-active") return { message: "Ya tenés la sesión iniciada", success: false, tone: "info" };
  if (result.status === "suspended") redirect(getAccessHref("suspended"));
  if (result.status !== "active") return { message: "No pudimos iniciar sesión. Revisá el correo, la contraseña y su verificación.", success: false };
  revalidatePath("/", "layout");
  redirect(result.role ? panelHref[result.role] : "/account");
}
export async function recoveryAction(_previous: AccountFormState, form: FormData): Promise<AccountFormState> {
  try { await requestRecovery({ email: form.get("email") }); } catch { /* same non-enumerating response */ }
  return genericRenewal;
}
export async function verificationAction(_previous: AccountFormState, form: FormData): Promise<AccountFormState> {
  try { await resendVerification({ email: form.get("email") }); } catch { /* same non-enumerating response */ }
  return genericRenewal;
}
export async function registerAccountAction(_previous: AccountFormState, form: FormData): Promise<AccountFormState> {
  const passwords = passwordConfirmationSchema.safeParse({ password: form.get("password"), confirmation: form.get("confirmation") });
  if (!passwords.success) return { message: passwordConfirmationMessage, success: false };
  try { await registerAccount({ email: form.get("email"), ...passwords.data, role: form.get("role") }); } catch { /* same safe response */ }
  return genericRenewal;
}
export async function passwordAction(_previous: AccountFormState, form: FormData): Promise<AccountFormState> {
  let success = false;
  try { success = await updatePassword({ password: form.get("password"), confirmation: form.get("confirmation") }); } catch { /* sanitized below */ }
  if (success) redirect("/?changed=1");
  return { message: "No se pudo guardar. Las contraseñas deben coincidir y tener al menos 6 caracteres. Si el enlace venció, solicitá uno nuevo.", success: false };
}
export async function logoutAction() {
  const client = await createServerSupabaseClient();
  await client.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/");
}
export async function accountStatusAction(_previous: AccountFormState, form: FormData): Promise<AccountFormState> {
  try {
    const result = await changeAccountStatus({
      accountId: form.get("accountId"), version: form.get("version"), command: form.get("command"),
      reason: form.get("reason") ?? "", confirmed: form.get("confirmed") === "on",
    });
    if (result.code === "CONFLICT_STALE_DATA") return { message: "Los datos cambiaron. Recargá la página antes de volver a intentar.", success: false };
    if (result.code !== "OK") return { message: "No se pudo realizar el cambio. Revisá el motivo, la confirmación y tus permisos.", success: false };
    revalidatePath("/account");
    return { message: "Cambio guardado con su historial. Recargá para ver el estado vigente.", success: true };
  } catch { return { message: "No se pudo realizar el cambio. Recargá la página e intentá nuevamente.", success: false }; }
}
