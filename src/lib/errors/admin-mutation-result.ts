import { publicErrorMessage, type PublicErrorCode } from "./codes";

export type AdminMutationResult = void | { code: "OK" | "DENIED" | "INVALID_INPUT" | PublicErrorCode };

export function adminMutationError(result: AdminMutationResult): string | null {
  if (!result || result.code === "OK") return null;
  if (result.code === "CONFLICT_STALE_DATA") {
    return "El registro cambió mientras lo editabas. Revisá los datos actualizados antes de volver a intentar.";
  }
  if (result.code === "INVALID_INPUT") return "Revisá los datos ingresados e intentá nuevamente.";
  if (result.code === "DENIED") return "No se pudo guardar. Verificá tus permisos y volvé a intentar.";
  return publicErrorMessage(result.code);
}
