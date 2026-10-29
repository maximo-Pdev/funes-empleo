import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut, UserRound, type LucideIcon } from "lucide-react";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/ui/dashboard-sidebar";
import { Form } from "@/components/forms/form";
import { logoutAction } from "@/features/accounts/actions";
import { HomeNavbar } from "@/app/(public)/home-navbar";
import { SidebarEmail } from "@/app/(auth)/account/sidebar-email";
import styles from "@/app/(auth)/account/account.module.css";

export type DashboardLink = { href: string; label: string; icon: LucideIcon; current: boolean };

/** Shared account chrome; role-specific data and content stay with the caller. */
export function DashboardShell({ panel, links, name, email, mainLabel, navigationLabel = "Secciones de mi cuenta", canvasSlot, children }: {
  panel: { href: string; label: string };
  links: readonly DashboardLink[];
  name: string;
  email?: string;
  mainLabel?: string;
  /** Accessible name of the section navigation; role-specific callers supply their own. */
  navigationLabel?: string;
  canvasSlot: string;
  children: ReactNode;
}) {
  return <div className={styles.page}>
    <HomeNavbar alwaysVisible panel={panel} notifications />
    <div className={styles.workspace}>
      <DashboardSidebar label={panel.label} navigation={
          <nav aria-label={navigationLabel} className={styles.navigation}>
            <SidebarMenu className={styles.menu}>
              {links.map(({ href, label, icon: Icon, current }) => <SidebarMenuItem key={href}>
                <Link href={href} aria-current={current ? "page" : undefined} className={styles.menuLink}>
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />{label}
                </Link>
              </SidebarMenuItem>)}
            </SidebarMenu>
          </nav>
      } logout={
          <Form action={logoutAction} className={styles.logoutForm}>
            <button type="submit" className={styles.logout}><LogOut className="h-4 w-4" aria-hidden="true" />Cerrar sesión</button>
          </Form>
      } identity={
          <div className={styles.identity}>
            <span role="img" aria-label="Foto de perfil de ejemplo" className={styles.avatar}><UserRound className="h-6 w-6" aria-hidden="true" /></span>
            <div className={styles.identityText}><p className={styles.name}>{name}</p><SidebarEmail email={email || "Correo no disponible"} /></div>
          </div>
      } />
      <main id="contenido" tabIndex={-1} aria-label={mainLabel} className={`${styles.main} ${styles.candidateWorkspace}`}>
        <div className={styles.candidateCanvas} data-slot={canvasSlot}>{children}</div>
      </main>
    </div>
  </div>;
}
