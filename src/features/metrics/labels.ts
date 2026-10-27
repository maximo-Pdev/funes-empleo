const labels: Record<string, string> = {
  active_candidates: "Candidatos activos", companies: "Empresas", applications: "Postulaciones y nominaciones",
  preinterviews: "Preentrevistas registradas", referrals: "Derivaciones", hired: "Contrataciones confirmadas",
  not_selected: "No selecciones", withdrawn: "Retiros", cancelled: "Cancelaciones", no_company_response: "Cierres sin respuesta",
  first_hire_days: "Días hasta primera contratación", coverage_days: "Días hasta cobertura total",
  category_active_candidates: "Candidatos activos por categoría", category_applications: "Participaciones por categoría", category_hired: "Contrataciones por categoría",
};
const states: Record<string, string> = { active: "activas", incomplete: "incompletas", suspended: "suspendidas", archived: "archivadas",
  draft: "en borrador", pending_review: "pendientes de revisión", changes_requested: "con correcciones solicitadas", published: "publicadas",
  paused: "pausadas", closed: "cerradas", rejected: "rechazadas", cancelled: "canceladas" };
export function metricLabel(indicator: string) {
  if (indicator.startsWith("companies_")) return `Empresas ${states[indicator.slice(10)] ?? "con estado no reconocido"}`;
  if (indicator.startsWith("openings_")) return `Ofertas ${states[indicator.slice(9)] ?? "con estado no reconocido"}`;
  return labels[indicator] ?? "Indicador no reconocido";
}
