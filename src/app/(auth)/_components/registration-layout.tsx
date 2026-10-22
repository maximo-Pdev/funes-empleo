import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, KeyRound, MailCheck, ShieldCheck, UserRoundPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import styles from "./registration.module.css";

const content = {
  candidate: {
    label: "Cuenta de postulante", title: "Registro de candidatos", guide: "Tu próximo paso laboral empieza acá.",
    introduction: "Creá tu cuenta y prepará tu perfil para postularte a las ofertas del portal.",
    description: "Completá tus datos de acceso y confirmá la contraseña. Tu perfil laboral se completa después.",
    steps: [
      ["Creá tu cuenta", "Completá tus datos de acceso en este formulario."],
      ["Verificá tu correo", "Seguí el enlace que recibirás por email."],
      ["Completá tu perfil laboral", "Después de ingresar, agregá tu experiencia, intereses y CV desde tu panel."],
    ],
    privacy: "La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.",
  },
  company: {
    label: "Cuenta de empresa", title: "Registro de empresas", guide: "Encontrá talento para tu empresa.",
    introduction: "Gestioná tus búsquedas laborales con el acompañamiento de la Oficina de Empleo de Funes.",
    description: "Completá los datos de tu empresa y de acceso. Todos los campos son obligatorios, salvo el teléfono.",
    steps: [
      ["Creá tu cuenta", "Registrá tu empresa y verificá tu correo para ingresar."],
      ["Prepará tu oferta", "Guardá un borrador y envialo a revisión municipal antes de su publicación."],
      ["Recibí perfiles derivados", "La Oficina preselecciona y deriva candidatos para tus ofertas."],
    ],
    privacy: "Las empresas acceden únicamente a los candidatos derivados por la Oficina a sus propias ofertas.",
  },
} as const;

export function RegistrationLayout({ role, children }: { role: keyof typeof content; children: ReactNode }) {
  const copy = content[role];
  const Icon = role === "candidate" ? UserRoundPlus : Building2;
  return <main id="contenido" tabIndex={-1} className="min-h-screen bg-page text-foreground">
    <header className="border-b border-border bg-surface">
      <div className={`${styles.container} flex items-center justify-between gap-4 py-3`}>
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg font-semibold text-primary-700">
          <Image src="/brand/logo-funes-gris.svg" alt="Municipalidad de Funes — inicio" width={44} height={44} className="h-11 w-11 rounded-lg border border-border bg-surface" />
          <span className="hidden leading-tight sm:block">Municipalidad de Funes<span className="block text-sm font-medium text-muted-foreground">Portal de Empleo</span></span>
        </Link>
        <Link href="/ofertas" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-secondary">Ver ofertas<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    </header>
    <div className={`${styles.container} ${styles.content} ${styles.registrationPage}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary-700 hover:underline hover:underline-offset-4"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver al inicio</Link>
        <nav aria-label="Tipo de registro" className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
          {([
            { value: "candidate", href: "/registro/candidato", label: "Soy postulante", icon: UserRoundPlus },
            { value: "company", href: "/registro/empresa", label: "Soy empresa", icon: Building2 },
          ] as const).map(option => <Link key={option.value} href={option.href} aria-current={role === option.value ? "page" : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${role === option.value ? "bg-primary text-primary-foreground" : "text-primary hover:bg-secondary"}`}>
            <option.icon className="h-4 w-4" aria-hidden="true" />{option.label}
          </Link>)}
        </nav>
      </div>
      <div className={styles.cards}>
        <section aria-labelledby="registration-guide" className={styles.guide} data-registration-card>
          <div className="flex items-center gap-3">
            <Image src="/brand/logo-funes-verde.svg" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-lg" />
            <p className="text-sm font-semibold leading-5">Oficina de Empleo<span className="block font-normal text-white/90">Municipalidad de Funes</span></p>
          </div>
          <h2 id="registration-guide" className="mt-5 text-3xl font-bold leading-tight tracking-tight">{copy.guide}</h2>
          <p className="mt-3 text-sm leading-6 text-white/90">{copy.introduction}</p>
          <ol className="my-5 space-y-4" aria-label="Pasos para empezar">
            {copy.steps.map(([title, description], index) => <li key={title} className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold" aria-hidden="true">{index + 1}</span>
              <div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-sm leading-6 text-white/90">{description}</p></div>
            </li>)}
          </ol>
          {role === "company" && <div className="mb-5 rounded-lg border border-white/20 bg-white/5 p-3">
            <p className="text-sm font-semibold">Sin verificación documental en el MVP</p>
            <p className="mt-1 text-sm leading-6 text-white/90">Verificar el correo confirma el acceso a la cuenta; no acredita la identidad de la empresa. Cada oferta requiere revisión municipal.</p>
          </div>}
          <div className="mt-auto flex items-start gap-3 border-t border-white/20 pt-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-400" aria-hidden="true" />
            <p className="text-sm leading-6 text-white/90">{copy.privacy}</p>
          </div>
        </section>
        <section aria-labelledby="registration-title" className={styles.formSection} data-registration-card>
          <Card className={styles.formCard}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary" aria-hidden="true"><Icon className="h-5 w-5" /></span>
              <div><p className="text-xs font-semibold text-primary-700">{copy.label}</p><h1 id="registration-title" className="text-2xl font-bold leading-8 tracking-tight text-primary-900">{copy.title}</h1></div>
            </div>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">{copy.description}</p>
            <div className={`${styles.form} ${role === "candidate" ? styles.candidate : styles.company}`}>{children}</div>
            <nav aria-label="Acceso" className={styles.access}>
              <Link href="/login" className={styles.link}>Ya tengo cuenta<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link href="/recover" className={styles.link}><KeyRound className="h-4 w-4" aria-hidden="true" />Recuperar acceso</Link>
            </nav>
            <div className={styles.mailHelp}>
              <MailCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-xs leading-5 text-foreground"><strong className="block text-primary-900">¿Ya recibiste el correo?</strong>Revisá también la carpeta de spam.</p>
              <Link href="/verification-pending" className={styles.link}>Ayuda para verificar mi correo</Link>
            </div>
          </Card>
        </section>
      </div>
      <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Oficina de Empleo de Funes · Entorno de prueba</p>
    </div>
  </main>;
}
