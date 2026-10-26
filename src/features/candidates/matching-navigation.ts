import { DEFAULT_OPENING_MATCH_ORDER, type OpeningMatchOrder } from "@/domain/catalogs/opening-match-order";

export function openingMatchesHref(openingReference: string, page = 1, order: OpeningMatchOrder = DEFAULT_OPENING_MATCH_ORDER) {
  const query = new URLSearchParams({ matchOrder: order });
  if (page > 1) query.set("matchPage", String(page));
  return `/admin/openings/${openingReference}?${query}#opening-matches`;
}
