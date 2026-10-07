import { CandidateShell } from "../_components/candidate-shell";
import styles from "../_components/candidate-forms.module.css";
import { UserRound } from "lucide-react";
import { Card } from "@/components/ui";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getCandidateWorkspace } from "@/features/candidates/profile-service";
import { getDemoConsentPolicy } from "@/features/candidates/consent-service";
import { CandidateProfilePanel } from "@/features/candidates/components/candidate-profile-panel";

export const dynamic = "force-dynamic";
export default async function CandidateProfilePage({ searchParams }: { searchParams: Promise<{ cv?: string }> }) {
  await requireActiveAccount(["candidate"]);
  const workspace = await getCandidateWorkspace();
  if (workspace.bootstrap !== "ready" || !workspace.profile) {
    const message = workspace.bootstrap === "pending_in_person_claim" ?
      "Encontramos un perfil asistido que podría ser tuyo. La vinculación requiere atención presencial en la Oficina; no se creó otro perfil." :
      workspace.bootstrap === "duplicate_review_required" ?
        "Los datos coinciden con otro perfil. Contactá a la Oficina para la revisión administrativa; no se fusionarán automáticamente." :
        "No se pudo completar el registro del perfil. Contactá a la Oficina de Empleo.";
    return <CandidateShell active="/candidato/perfil" title="Mi perfil"><Card className="p-6 sm:p-8"><UserRound className="h-8 w-8 text-primary" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold text-primary-900">Tu perfil requiere atención de la Oficina</h2><p role="alert" className="mt-3 max-w-3xl leading-7">{message}</p></Card></CandidateShell>;
  }
  const policy = await getDemoConsentPolicy();
  const { cv } = await searchParams;
  return <CandidateShell active="/candidato/perfil" title="Mi perfil" description="Completá y corregí tus datos. La Oficina decide qué perfiles deriva a cada empresa.">
    <div className={`${styles.forms} ${styles.profile}`}><CandidateProfilePanel profile={workspace.profile} dni={workspace.privateData.dni_display}
      address={workspace.privateData.address} phone={workspace.contacts.find((item) => item.kind === "phone")?.value ?? null}
      categories={workspace.allCategories} selectedCategories={workspace.categories.map((item) => item.category_id)}
      consent={workspace.consent} cv={workspace.cv} policy={policy} accountVersion={workspace.account.version}
      cvMessage={cv} /></div>
  </CandidateShell>;
}
