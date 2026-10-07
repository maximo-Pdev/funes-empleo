import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BriefcaseBusiness, ClipboardList, Home, ShieldCheck, UserRound, Settings } from "lucide-react";

const links = [
  { href: "/candidato/perfil", label: "Mi perfil", icon: UserRound },
  { href: "/candidato/ofertas", label: "Ofertas", icon: BriefcaseBusiness },
  { href: "/candidato/postulaciones", label: "Mis participaciones", icon: ClipboardList },
  { href: "/account", label: "Mi cuenta", icon: Settings },
];

export function CandidateShell({ title, description, active, children }: {
  title: string; description?: string; active?: string; children: ReactNode;
}) {
  return <div className="min-h-screen bg-page text-foreground">
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg font-semibold text-primary-700">
          <Image src="/brand/logo-funes-gris.svg" alt="Municipalidad de Funes — inicio" width={44} height={44} className="h-11 w-11 shrink-0 rounded-lg border border-border" />
          <span className="text-sm sm:text-base">Municipalidad de Funes<span className="block text-xs font-normal text-muted-foreground sm:text-sm">Portal de Empleo</span></span>
        </Link>
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-secondary"><Home className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Inicio</span><span className="sr-only sm:hidden">Inicio</span></Link>
      </div>
      <nav aria-label="Navegación de Área de candidatos" className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 pb-4 sm:flex sm:flex-wrap sm:px-6">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:justify-start ${active === href ? "bg-primary text-white" : "text-primary-700 hover:bg-secondary"}`}>
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />{label}
        </Link>)}
      </nav>
    </header>
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      <p className="text-sm font-semibold text-primary-700">Área de candidatos</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{description}</p>}
      <div className="mt-7">{children}</div>
      <footer className="mt-10 flex items-start gap-3 border-t border-border pt-5 text-sm leading-6 text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <p>La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.<span className="mt-2 block text-xs">Oficina de Empleo de Funes · Entorno de prueba</span></p>
      </footer>
    </main>
  </div>;
}
