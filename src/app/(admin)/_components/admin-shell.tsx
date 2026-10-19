import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BarChart3, BriefcaseBusiness, Building2, FileSpreadsheet, Home, LockKeyhole, Settings, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./admin-workspace.module.css";

const navigation = [
  { href: "/admin/candidates", label: "Candidatos", icon: Users },
  { href: "/admin/empresas", label: "Empresas", icon: Building2 },
  { href: "/admin/openings", label: "Ofertas", icon: BriefcaseBusiness },
  { href: "/admin/participations", label: "Participaciones", icon: ShieldCheck },
  { href: "/admin/imports", label: "Importaciones", icon: FileSpreadsheet },
  { href: "/admin/metrics", label: "Métricas", icon: BarChart3 },
];

type AdminShellProps = {
  title: string;
  description?: string;
  active: string;
  navigation?: readonly { href: string; label: string }[];
  children: ReactNode;
};

// Presentation only; each page and operation retains its server-side role checks.
export function AdminShell({ title, description, active, navigation: pageLinks = [], children }: AdminShellProps) {
  const contextualLinks = pageLinks.filter(link => link.href !== "/account" && (/^(Volver|Historial|Perfil)/.test(link.label) || !navigation.some(item => item.href === link.href)));
  return (
    <div className="min-h-screen bg-page text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg text-primary-700">
            <Image src="/brand/logo-funes-gris.svg" alt="Municipalidad de Funes — inicio" width={44} height={44} className="h-11 w-11 shrink-0 rounded-lg border border-border" />
            <span className="text-sm font-bold sm:text-base">Municipalidad de Funes<span className="block text-xs font-normal text-muted-foreground sm:text-sm">Portal de Empleo</span></span>
          </Link>
          <span className="hidden items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-primary-700 sm:inline-flex"><LockKeyhole className="h-4 w-4" aria-hidden="true" />Gestión municipal</span>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-secondary"><Home className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Inicio</span><span className="sr-only sm:hidden">Inicio</span></Link>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-surface px-4 py-4 sm:px-6 lg:min-h-[calc(100vh-77px)] lg:border-r lg:border-b-0 lg:px-4 lg:py-8">
          <nav aria-label="Navegación de Oficina de Empleo" className="lg:sticky lg:top-6">
            <p className="mb-3 hidden px-3 text-xs font-bold tracking-wider text-muted-foreground lg:block">OFICINA DE EMPLEO</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {navigation.map(({ href, label, icon: Icon }) => <li key={href}><Link href={href} aria-current={active === href ? "page" : undefined}
                className={`flex min-h-12 items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${active === href ? "bg-primary text-white" : "text-primary-700 hover:bg-secondary"}`}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{label}
              </Link></li>)}
            </ul>
            <Link href="/account" className="mt-3 flex min-h-12 items-center gap-2 rounded-lg border border-border px-3 py-3 text-sm font-semibold text-primary-700 hover:bg-secondary"><Settings className="h-4 w-4" aria-hidden="true" />Mi cuenta</Link>
          </nav>
        </aside>
        <main id="contenido" tabIndex={-1} className="min-w-0 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <p className="text-sm font-semibold text-primary-700">Oficina de Empleo</p>
          <h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{description}</p>}
          {contextualLinks.length > 0 && <nav aria-label="Accesos de esta página" className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
            {contextualLinks.map(({ href, label }) => <Link key={`${href}-${label}`} href={href} className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary underline underline-offset-4"><ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{label}</Link>)}
          </nav>}
          <div className={`${styles.workspace} mt-6`}>{children}</div>
          <footer className="mt-10 flex items-start gap-3 border-t border-border pt-5 text-sm leading-6 text-muted-foreground"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><p>Información de uso interno. La Oficina evalúa las postulaciones, decide las derivaciones y confirma los resultados.</p></footer>
        </main>
      </div>
    </div>
  );
}
