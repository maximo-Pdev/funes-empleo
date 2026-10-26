"use server";
import { recordReference } from "@/lib/records/references";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { publicErrorFrom, AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { databaseUuidSchema } from "@/validation/common";
import { saveAssistedCandidate } from "./assisted-service";
import { assistedAdminSession } from "./duplicate-service";
export async function saveAssistedAction(input: unknown) {
  try {
    const result = await saveAssistedCandidate(input);
    revalidatePath("/admin/candidates");
    revalidatePath("/admin/atencion-presencial");
    if (result.candidateId) revalidatePath("/admin/candidates/[candidateId]", "page");
    return { ...result, candidateReference: result.candidateId ? await recordReference("candidate", result.candidateId) : undefined, message: result.status === "duplicates" ? "Hay coincidencias por DNI o correo. Registrá una decisión explícita." : result.status === "rejected" ? "Alta rechazada con motivo registrado." : "Perfil guardado." };
  } catch (error) { return { status: "error" as const, message: publicErrorFrom(error).message }; }
}
const commandSchema = z.object({ candidateId: databaseUuidSchema, version: z.number().int().positive(),
  command: z.enum(["activate"]), confirmed: z.literal(true) });
export async function assistedCommandAction(input: unknown) {
  try {
    const parsed = commandSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION_ERROR");
    const session = await assistedAdminSession();
    const data = parsed.data;
    const result = await session.client.rpc("assisted_candidate_command", { p_candidate: data.candidateId,
      p_expected_version: data.version, p_command: data.command, p_policy_version: null, p_policy_hash: null });
    if (result.error) throw workflowRpcError(result.error.message);
    revalidatePath("/admin/candidates"); revalidatePath("/admin/candidates/[candidateId]", "page");
    revalidatePath("/admin/atencion-presencial");

    return { success: true, message: "Perfil activo para evaluación interna." };
  } catch (error) { return { success: false, message: publicErrorFrom(error).message }; }
}
