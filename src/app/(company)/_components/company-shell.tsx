import type { ReactNode } from "react";
import { companyNavigation } from "@/features/companies/navigation";
import { BriefcaseBusiness, Building2, LayoutDashboard, Settings } from "lucide-react";
import { DashboardShell } from "@/components/ui/dashboard-shell";
import styles from "@/app/(auth)/account/account.module.css";

const navigationIcons = [LayoutDashboard, Building2, BriefcaseBusiness, Settings];
const links = companyNavigation.map((link, index) => ({ ...link, icon: navigationIcons[index] ?? Building2 }));

export function CompanyShell({ title, description, active, name, email, children }: {
  title: string; description?: string; active?: string; name?: string | null; email?: string; children: ReactNode;
}) {
  return <DashboardShell panel={{ href: "/empresa", label: "Panel de empresa" }}
    links={links.map(link => ({ ...link, current: active === link.href }))}
    name={name || "Mi empresa"} email={email} canvasSlot="company-canvas">
    <div className={styles.sectionContent}>
      <header className={styles.heading}><h1>{title}</h1>{description && <p>{description}</p>}</header>
      {children}
      <p className={styles.notice}>La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.<span className="mt-2 block text-xs">Oficina de Empleo de Funes · Entorno de prueba</span></p>
    </div>
  </DashboardShell>;
}
