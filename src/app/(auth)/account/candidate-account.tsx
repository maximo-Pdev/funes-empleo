import Link from "next/link";
import { BriefcaseBusiness, ClipboardList, KeyRound, LogOut, UserRound } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Form } from "@/components/forms/form";
import { logoutAction } from "@/features/accounts/actions";
import { getCandidateWorkspace } from "@/features/candidates/profile-service";
import { renderCandidateProfileContent } from "../../(candidate)/candidato/_components/profile-content";
import { renderCandidateOffersContent } from "../../(candidate)/candidato/_components/offers-content";
import { renderCandidateParticipationsContent } from "../../(candidate)/candidato/_components/participations-content";
import { HomeNavbar } from "../../(public)/home-navbar";
import styles from "./account.module.css";
import { SidebarEmail } from "./sidebar-email";

export type AccountSearchParams = { section?: string; page?: string; oferta?: string; cv?: string };
const sections = [
  { id: "perfil", label: "Perfil", icon: UserRound },
  { id: "postulaciones", label: "Postulaciones", icon: ClipboardList },
  { id: "ofertas", label: "Ofertas", icon: BriefcaseBusiness },
] as const;

export async function renderCandidateAccount({ params, email }: { params: AccountSearchParams; email?: string }) {
  const section = params.section === "ofertas" || params.section === "postulaciones" ? params.section : "perfil";
  const workspace = await getCandidateWorkspace();
  const name = workspace.profile?.display_name || "Mi cuenta";
  const title = section === "ofertas" ? "Ofertas para postularme" : section === "postulaciones" ? "Mis postulaciones" : "Mi perfil";
  const description = section === "ofertas"
    ? "Explorá las ofertas vigentes y enviá tu postulación. La Oficina de Empleo acompaña el proceso de selección."
    : section === "postulaciones"
      ? "La Oficina de Empleo revisa cada caso. Se muestra la recepción y el resultado final, sin etapas internas."
      : "Completá y corregí tus datos. La Oficina decide qué perfiles deriva a cada empresa.";
  const content = section === "ofertas"
    ? await renderCandidateOffersContent({ workspace, page: params.page, oferta: params.oferta, profileHref: "/account?section=perfil", offersHref: "/account?section=ofertas" })
    : section === "postulaciones"
      ? await renderCandidateParticipationsContent({ offersHref: "/account?section=ofertas" })
      : await renderCandidateProfileContent({ workspace, cvMessage: params.cv, cvReturnTo: "/account?section=perfil" });

  return <div className={styles.page}>
    <HomeNavbar alwaysVisible />
    <div className={styles.workspace}>
      <Sidebar aria-label="Panel de usuario" className={styles.sidebar}>
        <SidebarContent>
          <nav aria-label="Secciones de mi cuenta" className={styles.navigation}>
            <SidebarMenu className={styles.menu}>
              {sections.map(({ id, label, icon: Icon }) => <SidebarMenuItem key={id}>
                <Link href={`/account?section=${id}`} aria-current={section === id ? "page" : undefined} className={styles.menuLink}>
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />{label}
                </Link>
              </SidebarMenuItem>)}
            </SidebarMenu>
          </nav>
        </SidebarContent>
        <SidebarFooter className={styles.footer}>
          <Link href="/update-password" className={styles.secondaryLink}><KeyRound className="h-4 w-4" aria-hidden="true" />Cambiar contraseña</Link>
          <Form action={logoutAction} className={styles.logoutForm}>
            <button type="submit" className={styles.logout}><LogOut className="h-4 w-4" aria-hidden="true" />Cerrar sesión</button>
          </Form>
          <div className={styles.identity}>
            <span role="img" aria-label="Foto de perfil de ejemplo" className={styles.avatar}><UserRound className="h-6 w-6" aria-hidden="true" /></span>
            <div className={styles.identityText}><p className={styles.name}>{name}</p><SidebarEmail email={email || "Correo no disponible"} /></div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <main id="contenido" tabIndex={-1} className={styles.main}>
        <header className={styles.heading}><h1>{title}</h1><p>{description}</p></header>
        {content}
        <p className={styles.notice}>La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.</p>
      </main>
    </div>
  </div>;
}
