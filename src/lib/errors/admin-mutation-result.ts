export type AdminMutationResult = void | { code: "OK" | "CONFLICT_STALE_DATA" | "DENIED" | "INVALID_INPUT" };

export function adminMutationError(result: AdminMutationResult): string | null {
  if (!result || result.code === "OK") return null;
  if (result.code === "CONFLICT_STALE_DATA") {
    return "El registro cambió mientras lo editabas. Revisá los datos actualizados antes de volver a intentar.";
  }
  if (result.code === "INVALID_INPUT") return "Revisá los datos ingresados e intentá nuevamente.";
  return "No se pudo guardar. Verificá tus permisos y volvé a intentar.";
}
