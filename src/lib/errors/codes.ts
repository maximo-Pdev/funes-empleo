export const PUBLIC_ERROR_CODES = [
  "AUTH_REQUIRED", "ACCESS_DENIED", "VALIDATION_ERROR", "CONFLICT_STALE_DATA",
  "INVALID_TRANSITION", "CONSENT_REQUIRED", "VALID_CV_REQUIRED", "NOT_FOUND",
  "INTERNAL_ERROR",
] as const;

export type PublicErrorCode = (typeof PUBLIC_ERROR_CODES)[number];

const PUBLIC_ERROR_MESSAGES: Record<PublicErrorCode, string> = {
  AUTH_REQUIRED: "Iniciá sesión para continuar.",
  ACCESS_DENIED: "No tenés permiso para realizar esta acción.",
  VALIDATION_ERROR: "Revisá los datos ingresados e intentá nuevamente.",
  CONFLICT_STALE_DATA: "Este registro cambió. Actualizá la página antes de volver a intentarlo.",
  INVALID_TRANSITION: "Esta acción no está disponible en el estado actual. Actualizá la página.",
  CONSENT_REQUIRED: "Revisá y aceptá el consentimiento vigente antes de continuar.",
  VALID_CV_REQUIRED: "Cargá un CV PDF válido antes de continuar.",
  NOT_FOUND: "No encontramos el recurso solicitado o no tenés acceso a él.",
  INTERNAL_ERROR: "No pudimos completar la operación. Intentá nuevamente y, si persiste, contactá a la Oficina de Empleo.",
};

export function publicErrorMessage(code: PublicErrorCode): string {
  return PUBLIC_ERROR_MESSAGES[code];
}
