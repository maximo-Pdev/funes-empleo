type OwnParticipation = { id: string; opening_id: string; display_status: string };

export const WITHDRAWN_APPLICATION_NOTICE = "Tu postulación anterior fue retirada. Podés volver a postularte si tu perfil y la oferta siguen habilitados. Se conservará el historial.";

// Presentation only. The application endpoint and database enforce eligibility.
export function getOfferApplicationState(participations: readonly OwnParticipation[], openingId: string) {
  const attempts = participations.filter(item => item.opening_id === openingId);
  const alreadyApplied = attempts.some(item => item.display_status !== "withdrawn");
  return {
    alreadyApplied,
    previouslyWithdrawn: !alreadyApplied && attempts.length > 0,
    attemptKey: `${openingId}:${attempts.map(item => `${item.id}:${item.display_status}`).sort().join(",")}`,
  };
}
