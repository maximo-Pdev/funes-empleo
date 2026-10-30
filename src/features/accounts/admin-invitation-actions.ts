"use server";
import type { AccountFormState } from "./form-state";
import { provisionAdministrator } from "./service";

export async function administratorInvitationAction(_previous: AccountFormState, form: FormData): Promise<AccountFormState> {
  if (form.get("confirmed") !== "on") return { message: "Confirmá que la invitación otorga permisos completos de administración.", success: false };
  try {
    await provisionAdministrator({ email: form.get("email") });
    return { message: "Invitación enviada. La persona debe abrir el enlace de su correo y definir su propia contraseña.", success: true };
  } catch {
    return { message: "No se pudo enviar la invitación. Revisá tus permisos e intentá nuevamente. Si el problema continúa, consultá al soporte del portal.", success: false };
  }
}
