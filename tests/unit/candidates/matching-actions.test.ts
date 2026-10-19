import { beforeEach, expect, it, vi } from "vitest";
const { preview, nominate, revalidate } = vi.hoisted(() => ({ preview: vi.fn(), nominate: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/features/candidates/matching-service", () => ({ getOpeningCandidatePreview: preview }));
vi.mock("@/features/participations/nomination-service", () => ({ createAdminNomination: nominate }));
vi.mock("next/cache", () => ({ revalidatePath: revalidate }));
import { openingCandidatePreviewAction } from "@/features/candidates/matching-actions";
import { createAdminNominationAction } from "@/features/participations/nomination-actions";
import { AppError } from "@/lib/errors/public-error";
import { openingPreview } from "../../fixtures/opening-preview";

beforeEach(() => vi.resetAllMocks());

it("preview transporta el contrato mínimo sin invalidar rutas", async () => {
  preview.mockResolvedValue(openingPreview);
  const input = { openingId: openingPreview.openingId, candidateId: openingPreview.id };
  expect(await openingCandidatePreviewAction(input)).toEqual({ code: "OK", profile: openingPreview });
  expect(preview).toHaveBeenCalledWith(input);
  expect(revalidate).not.toHaveBeenCalled();
});

it.each([new Error("SQL ficticio privado"), new AppError("ACCESS_DENIED")])("preview sanea errores %s", async error => {
  preview.mockRejectedValue(error);
  expect(await openingCandidatePreviewAction({})).toEqual({ code: error instanceof AppError ? "ACCESS_DENIED" : "INTERNAL_ERROR", profile: null });
});

it("nominación invalida oferta, candidato y participaciones solo tras éxito", async () => {
  nominate.mockResolvedValue(openingPreview.id);
  const input = { openingId: openingPreview.openingId, openingVersion: 3, candidateId: openingPreview.id, candidateVersion: 7 };
  expect(await createAdminNominationAction(input)).toEqual({ code: "OK", participationId: openingPreview.id });
  expect(nominate).toHaveBeenCalledWith(input);
  expect(revalidate.mock.calls).toEqual([["/admin/participations"], [`/admin/candidates/${openingPreview.id}`], [`/admin/openings/${openingPreview.openingId}`]]);
});

it("conflicto no se convierte en éxito ni invalida rutas", async () => {
  nominate.mockRejectedValue(new AppError("CONFLICT_STALE_DATA"));
  expect(await createAdminNominationAction({})).toEqual({ code: "CONFLICT_STALE_DATA" });
  expect(revalidate).not.toHaveBeenCalled();
});
