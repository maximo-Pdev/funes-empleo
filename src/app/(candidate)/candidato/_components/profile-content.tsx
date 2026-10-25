import { getCandidatePhoto, getPhotoCleanupPending } from "@/features/candidates/photo-service";
import { UserRound } from "lucide-react";
import { Card } from "@/components/ui";
import type { getCandidateWorkspace } from "@/features/candidates/profile-service";
import { getDemoConsentPolicy } from "@/features/candidates/consent-service";
import { CandidateProfilePanel } from "@/features/candidates/components/candidate-profile-panel";

export async function renderCandidateProfileContent({ workspace, cvMessage, cvReturnTo }: {
  workspace: Awaited<ReturnType<typeof getCandidateWorkspace>>;
  cvMessage?: string; cvReturnTo?: string;
}) {
  if (workspace.bootstrap !== "ready" || !workspace.profile) {
    const message = workspace.bootstrap === "pending_in_person_claim" ?
      "Encontramos un perfil asistido que podría ser tuyo. La vinculación requiere atención presencial en la Oficina; no se creó otro perfil." :
      workspace.bootstrap === "duplicate_review_required" ?
        "Los datos coinciden con otro perfil. Contactá a la Oficina para la revisión administrativa; no se fusionarán automáticamente." :
        "No se pudo completar el registro del perfil. Contactá a la Oficina de Empleo.";
    return <><Card className="p-6 sm:p-8"><UserRound className="h-8 w-8 text-primary" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold text-primary-900">Tu perfil requiere atención de la Oficina</h2><p role="alert" className="mt-3 max-w-3xl leading-7">{message}</p></Card></>;
  }
  // Photos are optional: a missing migration or temporary photo outage must not
  // prevent access to the existing personal data, CV and consent forms.
  const photoState = Promise.all([
    getCandidatePhoto(workspace.profile.id), getPhotoCleanupPending(workspace.profile.id),
  ]).then(([photo, cleanupPending]) => ({ photo, cleanupPending, unavailable: false }))
    .catch(() => ({ photo: null, cleanupPending: false, unavailable: true }));
  const [policy, photos] = await Promise.all([getDemoConsentPolicy(), photoState]);
  return <>
    <CandidateProfilePanel profile={workspace.profile} dni={workspace.privateData.dni_display}
      address={workspace.privateData.address} phone={workspace.contacts.find((item) => item.kind === "phone")?.value ?? null}
      categories={workspace.allCategories} selectedCategories={workspace.categories.map((item) => item.category_id)}
      consent={workspace.consent} cv={workspace.cv} policy={policy}
      photo={photos.photo} photoCleanupPending={photos.cleanupPending} photoUnavailable={photos.unavailable} cvMessage={cvMessage} cvReturnTo={cvReturnTo} />
  </>;
}