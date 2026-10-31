import { listPublicOffers, type PublicOffer } from "./public-service";

/** A bounded union of recent public matches; never uses the private matching RPC. */
export async function listSuggestedOffers(categoryCodes: readonly string[], appliedOpeningIds: readonly string[]): Promise<PublicOffer[]> {
  const codes = [...new Set(categoryCodes)].slice(0, 20);
  if (codes.length === 0) return [];
  const pages = await Promise.all(codes.map(rubro => listPublicOffers({ rubro, page: 1, pageSize: 30 })));
  const excluded = new Set(appliedOpeningIds);
  const unique = new Map<string, PublicOffer>();
  for (const page of pages) {
    for (const offer of page.items) {
      if (!excluded.has(offer.id)) unique.set(offer.id, offer);
    }
  }
  return [...unique.values()].slice(0, 6);
}
