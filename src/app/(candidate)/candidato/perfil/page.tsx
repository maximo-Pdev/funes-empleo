import { CandidateShell } from "../_components/candidate-shell";
import { renderCandidateProfileContent } from "../_components/profile-content";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getCandidateWorkspace } from "@/features/candidates/profile-service";

export const dynamic = "force-dynamic";
export default async function CandidateProfilePage({ searchParams }: { searchParams: Promise<{ cv?: string }> }) {
  await requireActiveAccount(["candidate"]);
  const workspace = await getCandidateWorkspace();
  const { cv } = await searchParams;
  return <CandidateShell active="/candidato/perfil" title="Mi perfil" description={workspace.bootstrap === "ready" && workspace.profile ? "Completá y corregí tus datos. La Oficina decide qué perfiles deriva a cada empresa." : undefined}>
    {await renderCandidateProfileContent({ workspace, cvMessage: cv })}
  </CandidateShell>;
}
