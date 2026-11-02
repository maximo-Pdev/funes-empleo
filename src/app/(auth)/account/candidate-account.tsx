import Link from "next/link";
import { Bell, BriefcaseBusiness, ClipboardList, GraduationCap, KeyRound, LayoutDashboard, Settings, UserRound } from "lucide-react";
import { CourseLinks } from "@/features/training/components/course-links";
import { CandidatePrivacyForm } from "@/features/candidates/components/candidate-privacy-form";
import { getDemoConsentPolicy } from "@/features/candidates/consent-service";
import { NotificationsContent } from "@/features/notifications/components/notifications-content";
import { DashboardShell } from "@/components/ui/dashboard-shell";
import { getCandidateWorkspace } from "@/features/candidates/profile-service";
import { renderCandidateProfileContent } from "../../(candidate)/candidato/_components/profile-content";

import { renderCandidateOffersContent } from "../../(candidate)/candidato/_components/offers-content";
import { renderCandidateParticipationsContent } from "../../(candidate)/candidato/_components/participations-content";
import styles from "./account.module.css";
import { renderCandidateDashboardContent } from "./dashboard-content";
import { getCandidatePhoto } from "@/features/candidates/photo-service";
import { CandidateSidebarPhoto } from "@/features/candidates/components/sidebar-photo";

export type AccountSearchParams = { section?: string; page?: string; oferta?: string; cv?: string; unavailable?: string };
const sections = [
  { id: "dashboard", label: "Panel de usuario", icon: LayoutDashboard },
  { id: "perfil", label: "Perfil", icon: UserRound },
  { id: "postulaciones", label: "Postulaciones", icon: ClipboardList },
  { id: "ofertas", label: "Ofertas", icon: BriefcaseBusiness },
  { id: "cursos", label: "Cursos", icon: GraduationCap },
  { id: "cuenta", label: "Cuenta", icon: Settings },
  { id: "notificaciones", label: "Notificaciones", icon: Bell },
] as const;

const sectionCopy = {
  dashboard: { title: "Panel de usuario", description: "Resumen de tu perfil y de tus postulaciones en el portal." },
  perfil: { title: "Mi perfil", description: "Completá y corregí tus datos. La Oficina decide qué perfiles deriva a cada empresa." },
  postulaciones: { title: "Mis postulaciones", description: "Consultá tus postulaciones, las preentrevistas registradas y los resultados confirmados por la Oficina de Empleo." },
  notificaciones: { title: "Notificaciones", description: "Novedades de tus postulaciones y del acompañamiento de la Oficina de Empleo." },
  ofertas: { title: "Ofertas para postularme", description: "Explorá las ofertas vigentes y enviá tu postulación. La Oficina de Empleo acompaña el proceso de selección." },
  cuenta: { title: "Cuenta", description: "Gestioná la contraseña y los permisos de privacidad de tu cuenta." },
  cursos: { title: "Cursos", description: "Consultá los enlaces de formación publicados por la Oficina de Empleo." },
} as const;

export async function renderCandidateAccount({ params, email, basePath = "/account" }: { params: AccountSearchParams; email?: string; basePath?: string }) {
  const requested = sections.find((item) => item.id === params.section)?.id;
  const section = requested ?? "dashboard";
  const workspace = await getCandidateWorkspace();
  const name = workspace.profile?.display_name || "Mi cuenta";
  const photoState = workspace.profile
    ? await getCandidatePhoto(workspace.profile.id).then(photo => ({ photo, unavailable: false })).catch(() => ({ photo: null, unavailable: true }))
    : { photo: null, unavailable: false };
  const { title, description } = sectionCopy[section];
  const href = (id: (typeof sections)[number]["id"], extra = "") => `${basePath}?section=${id}${extra}`;
  const content = section === "notificaciones" ? <NotificationsContent page={params.page} unavailable={params.unavailable} /> : section === "cuenta"
    ? <div className={styles.accountActions}>
      <div className={styles.accountPassword}><Link href="/update-password" className={styles.secondaryLink}><KeyRound className="h-4 w-4" aria-hidden="true" />Cambiar contraseña</Link></div>
      {workspace.bootstrap === "ready" && workspace.profile
        ? <CandidatePrivacyForm version={workspace.profile.version} consent={workspace.consent} policy={await getDemoConsentPolicy()} />
        : <p>Para gestionar los permisos de privacidad, primero completá la vinculación de tu perfil con la Oficina.</p>}
    </div>
    : section === "cursos" ? await CourseLinks()
    : section === "ofertas"
    ? await renderCandidateOffersContent({ workspace, page: params.page, oferta: params.oferta, profileHref: href("perfil"), offersHref: href("ofertas") })
    : section === "postulaciones"
      ? await renderCandidateParticipationsContent({ offersHref: href("ofertas") })
      : section === "perfil"
        ? await renderCandidateProfileContent({ workspace, cvMessage: params.cv, cvReturnTo: href("perfil"), privacyHref: href("cuenta"), photoState })
        : await renderCandidateDashboardContent({ workspace, profileHref: href("perfil"), participationsHref: href("postulaciones"), offersHref: href("ofertas") });

  return <DashboardShell panel={{ href: "/dashboard", label: "Panel de usuario" }}
    links={sections.map(({ id, label, icon }) => ({ href: href(id), label, icon, current: section === id }))}
    name={name} email={email} avatar={<CandidateSidebarPhoto photo={photoState.photo} name={name} />} mainLabel={section === "perfil" ? "Perfil" : undefined}
    canvasSlot={section === "perfil" ? "profile-canvas" : "candidate-canvas"}>
          {section === "perfil" ? <>
            <header className={`${styles.heading} ${styles.profileHeading}`}><h1>{title}</h1><p>{description}</p></header>
            {content}
            <p className={styles.profileNotice}>La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.</p>
          </> : <div className={styles.sectionContent}>
            <header className={styles.heading}><h1>{title}</h1><p>{description}</p></header>
            {(section === "ofertas" || section === "dashboard") && workspace.profile && workspace.consent?.status !== "accepted" && <p className="mb-6">Para postularte necesitás un permiso operativo vigente. <Link href={href("cuenta")} className="underline underline-offset-4">Gestionar privacidad en Cuenta</Link></p>}
            {content}
            <p className={styles.notice}>La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.</p>
          </div>}
  </DashboardShell>;
}
