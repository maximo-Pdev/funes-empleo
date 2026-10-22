import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ revalidate: vi.fn(), save: vi.fn(), phone: vi.fn(), activate: vi.fn(), consent: vi.fn(), apply: vi.fn(), withdraw: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/candidates/profile-service", () => ({ saveCandidateProfile: mocks.save, setCandidatePhone: mocks.phone, activateCandidate: mocks.activate, archiveCandidate: vi.fn() }));
vi.mock("@/features/candidates/consent-service", () => ({ changeCandidateConsent: mocks.consent }));
vi.mock("@/features/participations/candidate-service", () => ({ applyToOffer: mocks.apply, withdrawParticipation: mocks.withdraw }));
import { saveProfileAction, savePhoneAction, activateProfileAction } from "@/features/candidates/profile-actions";
import { changeConsentAction } from "@/features/candidates/consent-actions";
import { applyToOfferAction, withdrawParticipationAction } from "@/features/participations/candidate-actions";
beforeEach(() => vi.clearAllMocks());
it.each([
 [saveProfileAction, mocks.save, "/candidato/perfil"], [savePhoneAction, mocks.phone, "/candidato/perfil"], [activateProfileAction, mocks.activate, "/candidato/perfil"],
 [changeConsentAction, mocks.consent, "/candidato/perfil"], [applyToOfferAction, mocks.apply, "/candidato/postulaciones"], [withdrawParticipationAction, mocks.withdraw, "/candidato/postulaciones"],
] as const)("invalidates the account panel and preserves legacy invalidation after %s", async (action, service, legacy) => {
 const result = await action({ message: "", success: false }, new FormData());
 expect(service).toHaveBeenCalledOnce();
 expect(result.success).toBe(true);
 expect(mocks.revalidate).toHaveBeenCalledWith("/account");
 expect(mocks.revalidate).toHaveBeenCalledWith(legacy);
});
