import { formatCalendarDate } from "@/lib/time/presentation";
import { displayLabel } from "@/domain/presentation/labels";

// Presentation compatibility only, not an input or approved municipal catalog.
export function publicModalityLabel(value: string): string {
  return displayLabel({ onsite: "Presencial", remote: "Remoto", hybrid: "Híbrido", special: "Especial" }, value, value);
}

export function publicContractTypeLabel(value: string): string {
  return displayLabel({ fixed_term: "A plazo fijo", permanent: "Permanente", temporary: "Temporal", internship: "Pasantía",
    indefinite: "Por tiempo indeterminado", freelance: "Independiente", part_time: "A tiempo parcial",
    seasonal: "De temporada", eventual: "Eventual" }, value, value);
}

export const formatPublicClosingDate = formatCalendarDate;
