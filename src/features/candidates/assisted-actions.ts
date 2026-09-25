"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { publicErrorFrom, AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { databaseUuidSchema } from "@/validation/common";
import { getServerEnvironment } from "@/lib/env/server";
import { saveAssistedCandidate } from "./assisted-service";
import { assistedAdminSession } from "./duplicate-service";
export async function saveAssistedAction(input: unknown) {
  try {
    const result = await saveAssistedCandidate(input);
    revalidatePath("/admin/candidates");
    if (result.candidateId) revalidatePath(`/admin/candidates/${result.candidateId}`);
    return { ...result, message: result.status === "duplicates" ? "Hay coincidencias por DNI o correo. Registrá una decisión explícita." : result.status === "rejected" ? "Alta rechazada con motivo registrado." : "Perfil guardado." };
  } catch (error) { return { status: "error" as const, message: publicErrorFrom(error).message }; }
}
const commandSchema = z.object({ candidateId: databaseUuidSchema, version: z.number().int().positive(),
  command: z.enum(["activate", "accept_consent", "withdraw_consent"]), confirmed: z.literal(true),
  policyVersion: z.string().optional(), policyHash: z.string().optional() });
export async function assistedCommandAction(input: unknown) {
  try {
    const parsed = commandSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR");
    const session = await assistedAdminSession();
    const data = parsed.data;
    if (data.command !== "activate" && data.policyVersion !== getServerEnvironment().CONSENT_POLICY_VERSION) throw new AppError("VALIDATION_ERROR");
    const result = await session.client.rpc("assisted_candidate_command", { p_candidate: data.candidateId,
      p_expected_version: data.version, p_command: data.command, p_policy_version: data.policyVersion ?? null, p_policy_hash: data.policyHash ?? null });
    if (result.error) throw workflowRpcError(result.error.message);
    revalidatePath("/admin/candidates"); revalidatePath(`/admin/candidates/${data.candidateId}`);
    revalidatePath(`/admin/candidates/assisted/${data.candidateId}`);
    return { success: true, message: data.command === "activate" ? "Perfil activo para evaluación interna." : "Consentimiento registrado." };
  } catch (error) { return { success: false, message: publicErrorFrom(error).message }; }
}
