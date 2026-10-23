import type { AccountStatus, CompanyProfileStatus, CandidateProfileStatus, OpeningStatus, ParticipationStatus,
  ReferralAccessStatus, ConsentStatus, CvStatus, ImportBatchStatus, ImportRowStatus } from "@/domain/states";
import type { CONTACT_CHANNELS, MODERATION_DECISIONS } from "@/domain/catalogs";

export const accountStatusLabels = {
  pending_verification: "Verificación pendiente", active: "Activa", suspended: "Suspendida", archived: "Archivada",
} satisfies Record<AccountStatus, string>;
export const companyProfileStatusLabels = {
  incomplete: "Incompleto", active: "Activo", suspended: "Suspendido", archived: "Archivado",
} satisfies Record<CompanyProfileStatus, string>;
export const candidateProfileStatusLabels = {
  draft: "Borrador", active: "Activo", needs_update: "Necesita actualización", unavailable: "No disponible",
  consent_withdrawn: "Consentimiento retirado", archived: "Archivado",
} satisfies Record<CandidateProfileStatus, string>;
export const openingStatusLabels = {
  draft: "Borrador", pending_review: "Pendiente de revisión", changes_requested: "Correcciones solicitadas",
  published: "Publicada", paused: "Pausada", closed: "Cerrada", rejected: "Rechazada", suspended: "Suspendida", cancelled: "Cancelada",
} satisfies Record<OpeningStatus, string>;
export const participationStatusLabels = {
  received: "Recibida", under_review: "En revisión", preinterview: "Preentrevista", preselected: "Preseleccionada",
  referred: "Derivada", company_interview: "Entrevista empresarial", awaiting_feedback: "Esperando respuesta",
  hired: "Persona contratada", not_selected: "No seleccionada", withdrawn: "Retirada", cancelled: "Cancelada",
  no_company_response: "Sin respuesta empresarial",
} satisfies Record<ParticipationStatus, string>;
export const referralAccessLabels = {
  active: "Activo", revoked: "Revocado", expired_by_policy: "Vencido por política",
} satisfies Record<ReferralAccessStatus, string>;
export const consentStatusLabels = { accepted: "Aceptado", withdrawn: "Retirado" } satisfies Record<ConsentStatus, string>;
export const cvStatusLabels = {
  valid: "Válido", superseded: "Reemplazado", rejected: "Rechazado", archived: "Archivado",
} satisfies Record<CvStatus, string>;
export const importBatchStatusLabels = {
  uploaded: "Cargado", preview_ready: "Listo para confirmar", blocked: "Bloqueado", confirming: "Confirmando",
  completed: "Completado", failed: "Fallido", archived: "Archivado",
} satisfies Record<ImportBatchStatus, string>;
export const importRowStatusLabels = {
  valid: "Válida", warning: "Con advertencias", invalid: "Inválida", potential_duplicate: "Posible duplicado",
  unmapped_category: "Categoría sin correspondencia", imported: "Importada",
} satisfies Record<ImportRowStatus, string>;
export const contactChannelLabels = {
  phone: "Teléfono", email: "Correo electrónico", whatsapp: "WhatsApp", in_person: "Presencial", video: "Videollamada",
} satisfies Record<(typeof CONTACT_CHANNELS)[number] | "video", string>;
export const interviewStatusLabels = {
  scheduled: "Programada", completed: "Realizada", cancelled: "Cancelada", no_show: "No se presentó",
};
export const feedbackOutcomeLabels = {
  hired: "Contratación informada", not_selected: "No selección informada", candidate_withdrew: "Retiro informado por la persona",
  process_cancelled: "Cancelación del proceso informada", other: "Otra respuesta",
};
export const moderationDecisionLabels = {
  submitted: "Enviada a revisión", approved: "Aprobada", changes_requested: "Correcciones solicitadas", rejected: "Rechazada",
  paused: "Pausada", resumed: "Reanudada", closed: "Cerrada", auto_closed: "Cierre automático",
  suspended: "Suspendida", restored_to_draft: "Restaurada a borrador", cancelled: "Cancelada",
} satisfies Record<(typeof MODERATION_DECISIONS)[number], string>;
export const auditActionLabels = {
  account_created: "Cuenta creada", account_verified: "Cuenta verificada", admin_provisioned: "Administrador creado",
  account_suspended: "Cuenta suspendida", account_reactivated: "Cuenta reactivada", account_archived: "Cuenta archivada",
  account_restored: "Cuenta restaurada", profile_created: "Perfil creado", profile_updated: "Perfil actualizado",
  profile_activated: "Perfil activado", profile_archived: "Perfil archivado", profile_restored: "Perfil restaurado",
  profile_linked: "Perfil vinculado", availability_changed: "Disponibilidad actualizada", consent_accepted: "Consentimiento aceptado",
  consent_withdrawn: "Consentimiento retirado", cv_uploaded: "CV cargado", cv_replaced: "CV reemplazado", cv_archived: "CV archivado",
  duplicate_resolved: "Duplicado resuelto", opening_created: "Oferta creada", opening_updated: "Oferta actualizada",
  opening_submitted: "Oferta enviada a revisión", opening_approved: "Oferta aprobada",
  opening_changes_requested: "Correcciones de oferta solicitadas", opening_rejected: "Oferta rechazada", opening_paused: "Oferta pausada",
  opening_resumed: "Oferta reanudada", opening_closed: "Oferta cerrada", opening_auto_closed: "Oferta cerrada automáticamente",
  opening_suspended: "Oferta suspendida", opening_archived: "Oferta archivada", opening_restored: "Oferta restaurada",
  opening_cancelled: "Oferta cancelada", participation_created: "Participación registrada", participation_advanced: "Participación actualizada",
  stage_skipped: "Etapa omitida", preinterview_recorded: "Preentrevista registrada", preselection_recorded: "Preselección registrada",
  referral_created: "Derivación registrada", referral_revoked: "Acceso empresarial revocado", interview_recorded: "Entrevista registrada",
  feedback_recorded: "Respuesta empresarial registrada", outcome_confirmed: "Resultado confirmado", outcome_corrected: "Resultado corregido",
  no_company_response: "Cierre sin respuesta empresarial", post_hire_window_ended: "Plazo de acceso poscontratación vencido",
  contact_recorded: "Contacto registrado", note_recorded: "Nota registrada", import_confirmed: "Importación confirmada",
  import_completed: "Importación completada", import_failed: "Importación fallida", metrics_exported: "Métricas exportadas",
  freshness_due: "Perfil pendiente de actualización",
};
const reasonLabels = {
  hired: "Contratación confirmada", consent_withdrawn: "Consentimiento retirado", application_withdrawn: "Participación retirada",
  candidate_request: "Solicitud de la persona", candidate_withdrew: "Retiro de la persona", not_selected: "No selección",
  process_cancelled: "Proceso cancelado", no_company_response: "Sin respuesta empresarial", candidate_suspended: "Cuenta candidata suspendida",
  company_suspended: "Empresa suspendida", candidate_archived: "Perfil candidato archivado", company_archived: "Empresa archivada",
  post_hire_window_ended: "Plazo poscontratación vencido", policy_expired: "Permiso vencido por política",
  freshness_due: "Vigencia del perfil vencida", account_decision: "Decisión sobre la cuenta", referral_created: "Derivación registrada",
  fictitious_fixture: "Registro de demostración", late_company_response: "Respuesta empresarial tardía",
};

export function displayLabel(labels: Readonly<Record<string, string>>, value: string | null | undefined,
  fallback = "Estado no reconocido"): string {
  return value && Object.hasOwn(labels, value) ? labels[value]! : fallback;
}
export function availabilityLabel(value: string | null | undefined): string {
  return displayLabel({ available: "Disponible", unavailable: "No disponible" }, value, "Sin informar");
}
export function auditActionLabel(value: string): string {
  return displayLabel(auditActionLabels, value, "Evento registrado");
}
export function reasonLabel(value: string): string {
  return displayLabel(reasonLabels, value, "Motivo registrado");
}
export function auditStateLabel(value: string | null | undefined): string {
  return displayLabel({ ...accountStatusLabels, ...companyProfileStatusLabels, ...candidateProfileStatusLabels,
    ...openingStatusLabels, ...participationStatusLabels, ...consentStatusLabels, ...referralAccessLabels,
    ...cvStatusLabels, ...importBatchStatusLabels, available: "Disponible" }, value, value ? "Estado no reconocido" : "Sin cambio de estado");
}
