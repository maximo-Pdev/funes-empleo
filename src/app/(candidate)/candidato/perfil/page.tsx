import { RoleShell } from "@/components/layouts";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getCandidateWorkspace } from "@/features/candidates/profile-service";
import { getDemoConsentPolicy } from "@/features/candidates/consent-service";
import { CandidateProfilePanel } from "@/features/candidates/components/candidate-profile-panel";

export const dynamic = "force-dynamic";
export default async function CandidateProfilePage({ searchParams }: { searchParams: Promise<{ cv?: string }> }) {
  await requireActiveAccount(["candidate"]);
  const workspace = await getCandidateWorkspace();
  const nav = [{ href: "/candidato/perfil", label: "Mi perfil" }, { href: "/candidato/ofertas", label: "Ofertas" },
    { href: "/candidato/postulaciones", label: "Mis participaciones" }, { href: "/account", label: "Mi cuenta" }];
  if (workspace.bootstrap !== "ready" || !workspace.profile) {
    const message = workspace.bootstrap === "pending_in_person_claim" ?
      "Encontramos un perfil asistido que podría ser tuyo. La vinculación requiere atención presencial en la Oficina; no se creó otro perfil." :
      workspace.bootstrap === "duplicate_review_required" ?
        "Los datos coinciden con otro perfil. Contactá a la Oficina para la revisión administrativa; no se fusionarán automáticamente." :
        "No se pudo completar el registro del perfil. Contactá a la Oficina de Empleo.";
    return <RoleShell role="candidate" title="Mi perfil" navigation={nav}><p role="alert">{message}</p></RoleShell>;
  }
  const policy = await getDemoConsentPolicy();
  const { cv } = await searchParams;
  return <RoleShell role="candidate" title="Mi perfil" description="Completá y corregí tus datos. La Oficina decide qué perfiles deriva a cada empresa." navigation={nav}>
    <CandidateProfilePanel profile={workspace.profile} dni={workspace.privateData.dni_display}
      address={workspace.privateData.address} phone={workspace.contacts.find((item) => item.kind === "phone")?.value ?? null}
      categories={workspace.allCategories} selectedCategories={workspace.categories.map((item) => item.category_id)}
      consent={workspace.consent} cv={workspace.cv} policy={policy} accountVersion={workspace.account.version}
      cvMessage={cv} />
  </RoleShell>;
}
