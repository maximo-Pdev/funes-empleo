"use server";
import { revalidatePath } from "next/cache";
import { claimSchema } from "@/validation/duplicate-resolution";
import { AppError, publicErrorFrom } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { assistedAdminSession } from "./duplicate-service";
export async function claimAssistedAction(input: unknown) {
  try {
    const parsed = claimSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR");
    const session = await assistedAdminSession();
    const d = parsed.data;
    const result = await session.client.rpc("claim_assisted_profile", { p_candidate: d.candidateId, p_expected_version: d.version,
      p_account: d.accountId, p_dni: d.dni, p_in_person: d.verifiedInPerson, p_reason: d.reason });
    if (result.error) throw workflowRpcError(result.error.message);
    revalidatePath(`/admin/candidates/assisted/${d.candidateId}`); revalidatePath(`/admin/candidates/${d.candidateId}`);
    return { success: result.data === "linked", message: result.data === "linked" ? "Cuenta vinculada. Se conservan el perfil y su historial."
      : "Vinculación bloqueada por conflicto de cuenta, DNI o correo. Se registró una revisión de duplicados; corregí los datos y volvé a comprobar la identidad presencialmente." };
  } catch (error) { return { success: false, message: publicErrorFrom(error).message }; }
}
