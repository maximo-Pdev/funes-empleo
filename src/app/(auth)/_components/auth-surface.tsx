import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck, KeyRound, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import styles from "./auth-forms.module.css";

export function AuthShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-page text-foreground">
    <header className="border-b border-border bg-surface"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg font-semibold text-primary-700"><Image src="/brand/logo-funes-gris.svg" alt="Municipalidad de Funes — inicio" width={44} height={44} className="h-11 w-11 rounded-lg border border-border" /><span className="hidden leading-tight sm:block">Municipalidad de Funes<span className="block text-sm font-medium text-muted-foreground">Portal de Empleo</span></span></Link>
      <Link href="/ofertas" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-secondary">Ver ofertas<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
    </div></header>
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pb-14">
      <Link href="/" className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary-700 hover:underline hover:underline-offset-4"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver al inicio</Link>
      {children}
      <p className="mt-7 text-center text-xs leading-5 text-muted-foreground">Oficina de Empleo de Funes · Entorno de prueba</p>
    </main>
  </div>;
}
export function AuthSurface({ title, description, icon: Icon = KeyRound, children }: { title: string; description?: string; icon?: LucideIcon; children?: ReactNode }) {
  return <AuthShell><div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-8">
    <section aria-label="Portal Municipal de Empleo" className="order-2 rounded-2xl bg-primary-900 p-6 text-white sm:p-8 lg:order-1 lg:p-10">
      <div className="flex items-center gap-3"><Image src="/brand/logo-funes-verde.svg" alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-xl" /><p className="text-sm font-semibold leading-6">Oficina de Empleo<span className="block font-normal text-white/90">Municipalidad de Funes</span></p></div>
      <h2 className="mt-7 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Tu acceso al portal, con acompañamiento municipal.</h2>
      <p className="mt-5 text-base leading-7 text-white/90">Gestioná tu cuenta para continuar con tus trámites en el Portal de Empleo.</p>
      <div className="mt-7 flex items-start gap-3 border-t border-white/20 pt-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-400" aria-hidden="true" /><p className="text-sm leading-6 text-white/90">Usá tu cuenta individual y no compartas tu contraseña. Si necesitás ayuda, contactá a la Oficina de Empleo.</p></div>
    </section>
    <section aria-labelledby="auth-title" className="order-1 min-w-0 lg:order-2"><Card className="p-6 sm:p-8 lg:p-10">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary" aria-hidden="true"><Icon className="h-5 w-5" /></span>
      <h1 id="auth-title" className="mt-5 break-words text-3xl font-bold tracking-tight text-primary-900">{title}</h1>
      {description && <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>}
      <div className={`${styles.forms} mt-5`}>{children}</div>
      <nav aria-label="Acceso" className="mt-6 grid gap-2 border-t border-border pt-4 sm:flex sm:flex-wrap sm:gap-x-5">
        <Link href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-900">Iniciar sesión<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        <Link href="/recover" className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-900">Recuperar acceso</Link>
      </nav>
    </Card></section>
  </div></AuthShell>;
}
