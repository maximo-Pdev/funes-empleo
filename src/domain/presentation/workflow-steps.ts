import type { ParticipationStatus } from "@/domain/states";
import type { WorkflowStep } from "@/components/ui/workflow-steps";

type Guidance = { steps: WorkflowStep[]; description: string; target: string | null };
function stages(labels: string[], current: number, completed: number[]): WorkflowStep[] {
  return labels.map((label, index) => ({ label, state: index === current ? "current" : completed.includes(index) ? "completed" : "pending" }));
}

export function candidateWorkflow(displayStatus: string): WorkflowStep[] {
  const received = displayStatus === "received";
  return stages(["Postulación", "Recibida por la Oficina", "Resultado"], received ? 1 : 2, received ? [0] : [0, 1]);
}

export function adminWorkflow(status: ParticipationStatus, pendingFeedback: boolean): Guidance {
  const labels = ["Recepción", "Evaluación municipal", "Derivación", "Respuesta empresarial", "Resultado confirmado"];
  if (["hired", "not_selected", "withdrawn", "cancelled"].includes(status)) {
    return { steps: stages(labels, 4, [0]), target: null, description: "Caso finalizado. Consultá el resultado y el historial; no hay nuevas acciones de avance." };
  }
  if (status === "no_company_response") {
    return { steps: stages(labels, 3, [0, 1, 2]), target: "#case-actions", description: "Sin respuesta empresarial. Una corrección tardía requiere evidencia de contacto o respuesta; conservá el historial." };
  }
  if (["referred", "company_interview", "awaiting_feedback"].includes(status)) {
    return { steps: stages(labels, 3, [0, 1, 2]), target: pendingFeedback ? "#feedback-review" : "#contact-record",
      description: pendingFeedback ? "Revisá la respuesta empresarial pendiente y confirmá el resultado con evidencia. El informe de la empresa no es todavía un resultado final." : "Esperá la respuesta de la empresa o registrá el contacto de seguimiento. No confirmes un resultado sin evidencia." };
  }
  return { steps: stages(labels, status === "received" ? 0 : 1, status === "received" ? [] : [0]), target: "#case-actions",
    description: "Revisá el perfil y decidí el avance. La preentrevista es opcional: podés derivar directamente. Los saltos de etapa requieren un motivo; nominar no comparte el perfil con la empresa." };
}

export function companyOpeningWorkflow(status: string): Guidance {
  const labels = ["Preparar oferta", "Revisión municipal", "Derivaciones y resultados"];
  if (["draft", "changes_requested"].includes(status)) return { steps: stages(labels, 0, []), target: "#offer-management", description: "Revisá los datos, guardá la oferta y enviala a revisión municipal. Solo las ofertas aprobadas se publican." };
  if (status === "pending_review") return { steps: stages(labels, 1, [0]), target: "#offer-management", description: "Esperá la decisión municipal. Consultá el historial para conocer correcciones solicitadas." };
  if (["published", "paused", "closed"].includes(status)) return { steps: stages(labels, 2, [0, 1]), target: "#derivaciones", description: "Consultá solo los perfiles derivados por la Oficina e informá el resultado de cada caso. La Oficina confirma el resultado final." };
  return { steps: stages(labels, 1, [0]), target: null, description: "Consultá el estado y el historial de moderación. Esta oferta no admite un nuevo envío desde aquí." };
}
