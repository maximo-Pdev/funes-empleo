import Link from "next/link";
import { ArrowLeft, BarChart3, BriefcaseBusiness, Building2, FileSpreadsheet, Settings, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/ui/dashboard-shell";
import accountStyles from "@/app/(auth)/account/account.module.css";
import styles from "./admin-workspace.module.css";

const navigation = [
  { href: "/admin/candidates", label: "Candidatos", icon: Users },
  { href: "/admin/atencion-presencial", label: "Atención presencial", icon: Users },
  { href: "/admin/empresas", label: "Empresas", icon: Building2 },
  { href: "/admin/openings", label: "Ofertas", icon: BriefcaseBusiness },
  { href: "/admin/participations", label: "Participaciones", icon: ShieldCheck },
  { href: "/admin/imports", label: "Importaciones", icon: FileSpreadsheet },
  { href: "/admin/metrics", label: "Métricas", icon: BarChart3 },
  { href: "/account", label: "Mi cuenta", icon: Settings },
];

type AdminShellProps = {
  title: string;
  description?: string;
  active: string;
  email?: string;
  navigation?: readonly { href: string; label: string }[];
  children: ReactNode;
};

// Presentation only; each page and operation retains its server-side role checks.
export function AdminShell({ title, description, active, email, navigation: pageLinks = [], children }: AdminShellProps) {
  const contextualLinks = pageLinks.filter(link => link.href !== "/account" && (/^(Volver|Historial|Perfil)/.test(link.label) || !navigation.some(item => item.href === link.href)));
  return (
    <DashboardShell panel={{ href: "/account", label: "Panel de administración" }}
      links={navigation.map(link => ({ ...link, current: active === link.href }))}
      navigationLabel="Navegación de Oficina de Empleo"
      name="Administración" email={email} canvasSlot="admin-canvas">
      <div className={accountStyles.sectionContent}>
          <header className={accountStyles.heading}><h1>{title}</h1>{description && <p>{description}</p>}</header>
          {contextualLinks.length > 0 && <nav aria-label="Accesos de esta página" className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
            {contextualLinks.map(({ href, label }) => <Link key={`${href}-${label}`} href={href} className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary underline underline-offset-4"><ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{label}</Link>)}
          </nav>}
          <div className={`${styles.workspace} mt-6`}>{children}</div>
          <p className={accountStyles.notice}>Información de uso interno. La Oficina evalúa las postulaciones, decide las derivaciones y confirma los resultados.</p>
      </div>
    </DashboardShell>
  );
}
