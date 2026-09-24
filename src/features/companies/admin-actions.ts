"use server";
import { revalidatePath } from "next/cache";
import { changeAccountStatus } from "@/features/accounts/service";
import { publicErrorFrom } from "@/lib/errors/public-error";
import { databaseUuidSchema } from "@/validation/common";
import { z } from "zod";

const inputSchema = z.object({ accountId: databaseUuidSchema, version: z.coerce.number().int().positive(),
  command: z.enum(["suspend", "reactivate", "archive", "restore"]), reason: z.string().trim().min(1).max(500),
  confirmed: z.literal(true) });
export async function adminCompanyAction(_previous: { message: string; success: boolean }, form: FormData) {
  const parsed = inputSchema.safeParse({ accountId: form.get("accountId"), version: form.get("version"),
    command: form.get("command"), reason: form.get("reason"), confirmed: form.get("confirmed") === "on" });
  if (!parsed.success) return { message: "Confirmá la acción e ingresá un motivo interno.", success: false };
  try {
    const result = await changeAccountStatus(parsed.data);
    if (result.code !== "OK") return { message: result.code === "CONFLICT_STALE_DATA" ?
      "Los datos cambiaron. Recargá antes de intentar nuevamente." : "No se pudo cambiar el estado de la empresa.", success: false };
    revalidatePath("/admin/empresas"); revalidatePath("/admin/openings");
    return { message: "Decisión registrada con historial. Recargá para ver el estado actual.", success: true };
  } catch (error) { return { message: publicErrorFrom(error).message, success: false }; }
}
