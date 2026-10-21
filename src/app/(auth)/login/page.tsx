import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, KeyRound, MailCheck, ShieldCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AuthForm } from "@/features/accounts/components/auth-form";
import styles from "@/app/(auth)/_components/registration.module.css";

export default function LoginPage() {
  return <main id="contenido" tabIndex={-1} className={["min-h-screen bg-page text-foreground", styles.loginPage].join(" ")}>
    <header className="border-b border-border bg-surface">
      <div className={styles.container}>
        <div className="flex items-center justify-between gap-4 py-3">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg font-semibold text-primary-700">
            <Image src="/brand/logo-funes-gris.svg" alt="Municipalidad de Funes — inicio" width={44} height={44} className="h-11 w-11 rounded-lg border border-border bg-surface" />
            <span className="hidden leading-tight sm:block">Municipalidad de Funes<span className="block text-sm font-medium text-muted-foreground">Portal de Empleo</span></span>
          </Link>
          <Link href="/ofertas" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-secondary">Ver ofertas<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </div>
    </header>
    <div className={[styles.container, styles.content, styles.loginContent].join(" ")}>
      <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary-700 hover:underline hover:underline-offset-4"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver al inicio</Link>
      <div className={[styles.cards, styles.loginCards].join(" ")}>
        <section aria-labelledby="signup-title" className={styles.loginSignup} data-login-signup>
          <Card className={styles.signupCard}>
            <div>
              <h2 id="signup-title" className="text-base font-bold text-primary-900">¿Todavía no tenés cuenta?</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">Elegí cómo querés participar en el portal.</p>
            </div>
            <nav aria-label="Crear una cuenta" className={styles.signupLinks}>
              <Link href="/registro/candidato" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-2 py-2 text-sm font-semibold text-primary hover:bg-secondary"><Users className="h-4 w-4 shrink-0" aria-hidden="true" />Soy postulante</Link>
              <Link href="/registro/empresa" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-2 py-2 text-sm font-semibold text-primary hover:bg-secondary"><Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />Soy empresa</Link>
            </nav>
          </Card>
        </section>
        <section aria-label="Portal Municipal de Empleo" className={styles.guide} data-login-card>
          <div className="flex items-center gap-3">
            <Image src="/brand/logo-funes-verde.svg" alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-lg" />
            <p className="text-sm font-semibold leading-5">Oficina de Empleo<span className="block font-normal text-white/90">Municipalidad de Funes</span></p>
          </div>
          <p className="mt-5 text-3xl font-bold leading-tight tracking-tight">El empleo en Funes, con acompañamiento municipal.</p>
          <p className="mt-3 text-sm leading-6 text-white/90">Ingresá para continuar con tu perfil y gestionar tus oportunidades desde un mismo lugar.</p>
          <div className="my-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10" aria-hidden="true"><Users className="h-4 w-4" /></span>
              <div><p className="text-sm font-semibold">Postulantes</p><p className="mt-1 text-sm leading-6 text-white/90">Completá tu perfil y postulate a ofertas vigentes.</p></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10" aria-hidden="true"><Building2 className="h-4 w-4" /></span>
              <div><p className="text-sm font-semibold">Empresas</p><p className="mt-1 text-sm leading-6 text-white/90">Gestioná tus ofertas y los perfiles derivados por la Oficina.</p></div>
            </div>
          </div>
          <div className="mt-auto flex items-start gap-3 border-t border-white/20 pt-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-400" aria-hidden="true" />
            <p className="text-sm leading-6 text-white/90">La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.</p>
          </div>
        </section>
        <section aria-labelledby="login-title" className={styles.formSection} data-login-card>
          <Card className={[styles.formCard, styles.loginCard].join(" ")}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary" aria-hidden="true"><KeyRound className="h-5 w-5" /></span>
              <h1 id="login-title" className="text-2xl font-bold leading-8 tracking-tight text-primary-900">Iniciar sesión</h1>
            </div>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">Usá tu cuenta individual y tu correo verificado.</p>
            <div className={[styles.form, styles.loginForm].join(" ")}><AuthForm mode="login" /></div>
            <nav aria-label="Ayuda para acceder" className={styles.access}>
              <Link href="/recover" className={styles.link}><KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />Recuperar acceso</Link>
              <Link href="/verification-pending" className={styles.link}><MailCheck className="h-4 w-4 shrink-0" aria-hidden="true" />Necesito verificar mi correo</Link>
            </nav>
          </Card>
        </section>
      </div>
      <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Oficina de Empleo de Funes · Entorno de prueba</p>
    </div>
  </main>;
}
