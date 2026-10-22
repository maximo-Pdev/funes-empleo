import type { PublicOfferSearch } from "@/validation/public-offer-search";

export function hasPublicOfferFilters(filters: PublicOfferSearch) {
  return Boolean(filters.q || filters.rubro || filters.localidad || filters.modalidad);
}
export function publicOffersPageHref(filters: PublicOfferSearch, page: number) {
  const params = new URLSearchParams();
  for (const name of ["q", "rubro", "localidad", "modalidad"] as const) {
    if (filters[name]) params.set(name, filters[name]);
  }
  params.set("page", String(page));
  return `/ofertas?${params}`;
}
