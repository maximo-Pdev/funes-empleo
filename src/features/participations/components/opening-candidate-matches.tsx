import { recordReference } from "@/lib/records/references";
import { RECORD_PAGE_SIZE } from "@/lib/collections/limits";
import { FeedbackMessage } from "@/components/ui";
import { getOpeningMatches } from "@/features/candidates/matching-service";
import { openingMatchingInput, type OpeningMatches } from "@/validation/opening-matching";
import { OpeningCandidateMatchesList } from "./opening-candidate-matches-list";
import { OpeningMatchOrderForm } from "./opening-match-order-form";
export { OpeningCandidateMatchesList } from "./opening-candidate-matches-list";

export async function OpeningCandidateMatches({ openingId, page, order }: { openingId: string; page?: string | string[]; order?: string | string[] }) {
  const input = openingMatchingInput.safeParse({ openingId, page, order, pageSize: RECORD_PAGE_SIZE });
  if (!input.success) return <FeedbackMessage tone="error">Revisá la página o el orden de coincidencias solicitado.</FeedbackMessage>;
  let matches: OpeningMatches;
  try {
    matches = await getOpeningMatches(input.data);
  } catch {
    return <FeedbackMessage tone="error">No pudimos cargar las coincidencias. Recargá la página para intentarlo nuevamente.</FeedbackMessage>;
  }
  const openingReference = await recordReference("opening", openingId);
  return <OpeningCandidateMatchesList openingId={openingId} openingReference={openingReference} matches={matches} order={input.data.order}
    orderForm={<OpeningMatchOrderForm openingReference={openingReference} order={input.data.order} available={matches.available} />} />;
}
