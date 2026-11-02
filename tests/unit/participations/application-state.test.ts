import { expect, it } from "vitest";
import { getOfferApplicationState } from "@/features/participations/application-state";

const attempt = (id: string, display_status: string, opening_id = "offer") => ({ id, display_status, opening_id });
it("ignora otras ofertas y distingue ausencia de historial", () => {
  expect(getOfferApplicationState([attempt("other", "received", "elsewhere")], "offer"))
    .toEqual({ alreadyApplied: false, previouslyWithdrawn: false, attemptKey: "offer:" });
});
it("múltiples retiros permiten otro intento sin importar el orden del lector", () => {
  const attempts = [attempt("b", "withdrawn"), attempt("a", "withdrawn")];
  expect(getOfferApplicationState(attempts, "offer"))
    .toEqual({ alreadyApplied: false, previouslyWithdrawn: true, attemptKey: "offer:a:withdrawn,b:withdrawn" });
  expect(getOfferApplicationState([...attempts].reverse(), "offer"))
    .toEqual(getOfferApplicationState(attempts, "offer"));
});
it.each(["received", "under_review", "referred", "hired", "not_selected", "cancelled", "no_company_response", "unknown"])("un caso %s bloquea aunque haya retiros", status => {
  expect(getOfferApplicationState([attempt("old", "withdrawn"), attempt("new", status)], "offer"))
    .toMatchObject({ alreadyApplied: true, previouslyWithdrawn: false });
});
it("la clave cambia con cada retiro y cada nuevo intento para limpiar el éxito anterior", () => {
  const active = getOfferApplicationState([attempt("first", "received")], "offer").attemptKey;
  const withdrawn = getOfferApplicationState([attempt("first", "withdrawn")], "offer").attemptKey;
  const twice = getOfferApplicationState([attempt("first", "withdrawn"), attempt("second", "withdrawn")], "offer").attemptKey;
  expect(new Set([active, withdrawn, twice]).size).toBe(3);
});
