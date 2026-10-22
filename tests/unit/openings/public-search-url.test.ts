import { expect, it } from "vitest";
import { publicOfferSearchSchema } from "@/validation/public-offer-search";
import { hasPublicOfferFilters, publicOffersPageHref } from "@/features/openings/public-search";

it("codifica texto literal sin inyectar parámetros extra", () => {
  const filters = publicOfferSearchSchema.parse({ q: "depósito & page=999", localidad: " Funes " });
  const url = new URL(publicOffersPageHref(filters, 2), "https://example.invalid");
  expect(url.searchParams.getAll("page")).toEqual(["2"]);
  expect(url.searchParams.get("q")).toBe("depósito & page=999");
  expect(url.searchParams.get("localidad")).toBe("funes");
  expect(hasPublicOfferFilters(filters)).toBe(true);
});
it("conserva las URLs de paginación anteriores sin filtros", () => {
  const filters = publicOfferSearchSchema.parse({});
  expect(hasPublicOfferFilters(filters)).toBe(false);
  expect(publicOffersPageHref(filters, 3)).toBe("/ofertas?page=3");
});
