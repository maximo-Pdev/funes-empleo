import { FeedbackMessage } from "@/components/ui";
import { getOpeningMatches } from "@/features/candidates/matching-service";
import { openingMatchingInput, type OpeningMatches } from "@/validation/opening-matching";
import { OpeningCandidateMatchesList } from "./opening-candidate-matches-list";
export { OpeningCandidateMatchesList } from "./opening-candidate-matches-list";

export async function OpeningCandidateMatches({ openingId, page }: { openingId: string; page?: string | string[] }) {
  const input = openingMatchingInput.safeParse({ openingId, page, pageSize: 12 });
  if (!input.success) return <FeedbackMessage tone="error">Revisá la página de coincidencias solicitada.</FeedbackMessage>;
  let matches: OpeningMatches;
  try {
    matches = await getOpeningMatches(input.data);
  } catch {
    return <FeedbackMessage tone="error">No pudimos cargar las coincidencias. Recargá la página para intentarlo nuevamente.</FeedbackMessage>;
  }
  return <OpeningCandidateMatchesList openingId={openingId} matches={matches} />;
}
