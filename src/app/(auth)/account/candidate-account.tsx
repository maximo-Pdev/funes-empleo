import Link from "next/link";
import { BriefcaseBusiness, ClipboardList, KeyRound, LayoutDashboard, Settings, UserRound } from "lucide-react";
import { DashboardShell } from "@/components/ui/dashboard-shell";
import { getCandidateWorkspace } from "@/features/candidates/profile-service";
import { renderCandidateProfileContent } from "../../(candidate)/candidato/_components/profile-content";

import { renderCandidateOffersContent } from "../../(candidate)/candidato/_components/offers-content";
import { renderCandidateParticipationsContent } from "../../(candidate)/candidato/_components/participations-content";
import styles from "./account.module.css";
import { renderCandidateDashboardContent } from "./dashboard-content";

export type AccountSearchParams = { section?: string; page?: string; oferta?: string; cv?: string };
const sections = [
  { id: "dashboard", label: "Panel de usuario", icon: LayoutDashboard },
  { id: "perfil", label: "Perfil", icon: UserRound },
  { id: "postulaciones", label: "Postulaciones", icon: ClipboardList },
  { id: "ofertas", label: "Ofertas", icon: BriefcaseBusiness },
  { id: "cuenta", label: "Cuenta", icon: Settings },
] as const;

const sectionCopy = {
  dashboard: { title: "Panel de usuario", description: "Resumen de tu perfil y de tus postulaciones en el portal." },
  perfil: { title: "Mi perfil", description: "Completá y corregí tus datos. La Oficina decide qué perfiles deriva a cada empresa." },
  postulaciones: { title: "Mis postulaciones", description: "La Oficina de Empleo revisa cada caso. Se muestra la recepción y el resultado final, sin etapas internas." },
  ofertas: { title: "Ofertas para postularme", description: "Explorá las ofertas vigentes y enviá tu postulación. La Oficina de Empleo acompaña el proceso de selección." },
  cuenta: { title: "Cuenta", description: "Gestioná la contraseña de tu cuenta." },
} as const;

export async function renderCandidateAccount({ params, email, basePath = "/account" }: { params: AccountSearchParams; email?: string; basePath?: string }) {
  const requested = sections.find((item) => item.id === params.section)?.id;
  const section = requested ?? "dashboard";
  const workspace = await getCandidateWorkspace();
  const name = workspace.profile?.display_name || "Mi cuenta";
  const { title, description } = sectionCopy[section];
  const href = (id: (typeof sections)[number]["id"], extra = "") => `${basePath}?section=${id}${extra}`;
  const content = section === "cuenta"
    ? <div className={styles.accountActions}>
      <Link href="/update-password" className={styles.secondaryLink}><KeyRound className="h-4 w-4" aria-hidden="true" />Cambiar contraseña</Link>
    </div>
    : section === "ofertas"
    ? await renderCandidateOffersContent({ workspace, page: params.page, oferta: params.oferta, profileHref: href("perfil"), offersHref: href("ofertas") })
    : section === "postulaciones"
      ? await renderCandidateParticipationsContent({ offersHref: href("ofertas") })
      : section === "perfil"
        ? await renderCandidateProfileContent({ workspace, cvMessage: params.cv, cvReturnTo: href("perfil") })
        : await renderCandidateDashboardContent({ workspace, profileHref: href("perfil"), participationsHref: href("postulaciones"), offersHref: href("ofertas") });

  return <DashboardShell panel={{ href: "/dashboard", label: "Panel de usuario" }}
    links={sections.map(({ id, label, icon }) => ({ href: href(id), label, icon, current: section === id }))}
    name={name} email={email} mainLabel={section === "perfil" ? "Perfil" : undefined}
    canvasSlot={section === "perfil" ? "profile-canvas" : "candidate-canvas"}>
          {section === "perfil" ? <>
            <header className={styles.heading}><h1>{title}</h1><p>{description}</p></header>
            {content}
            <p className={styles.profileNotice}>La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.</p>
          </> : <div className={styles.sectionContent}>
            <header className={styles.heading}><h1>{title}</h1><p>{description}</p></header>
            {content}
            <p className={styles.notice}>La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.</p>
          </div>}
  </DashboardShell>;
}
