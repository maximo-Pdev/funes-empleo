import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, KeyRound, MailCheck, ShieldCheck, Users } from "lucide-react";
import { Card } from "@/components/ui";
import { AuthForm } from "@/features/accounts/components/auth-form";

export default function LoginPage() {
  return (
    <main id="contenido" tabIndex={-1} className="min-h-screen bg-page text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg font-semibold text-primary-700">
            <Image
              src="/brand/logo-funes-gris.svg"
              alt="Municipalidad de Funes — inicio"
              width={44}
              height={44}
              className="h-11 w-11 rounded-lg border border-border bg-surface"
            />
            <span className="hidden leading-tight sm:block">
              Municipalidad de Funes
              <span className="block text-sm font-medium text-muted-foreground">Portal de Empleo</span>
            </span>
          </Link>
          <Link href="/ofertas" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-secondary">
            Ver ofertas
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pb-14">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary-700 hover:underline hover:underline-offset-4">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al inicio
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-8">
          <section aria-label="Portal Municipal de Empleo" className="order-2 rounded-2xl bg-primary-900 p-6 text-white sm:p-8 lg:order-1 lg:p-10">
            <div className="flex items-center gap-3">
              <Image src="/brand/logo-funes-verde.svg" alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-xl" />
              <p className="text-sm font-semibold leading-6">Oficina de Empleo<span className="block font-normal text-white/90">Municipalidad de Funes</span></p>
            </div>
            <p className="mt-7 max-w-md text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              El empleo en Funes, con acompañamiento municipal.
            </p>
            <p className="mt-5 max-w-md text-base leading-7 text-white/90">Ingresá para continuar con tu perfil y gestionar tus oportunidades desde un mismo lugar.</p>

            <div className="mt-8 hidden space-y-6 lg:block">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10" aria-hidden="true"><Users className="h-5 w-5" /></span>
                <div><p className="font-semibold">Postulantes</p><p className="mt-1 text-sm leading-6 text-white/90">Completá tu perfil y postulate a ofertas vigentes.</p></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10" aria-hidden="true"><Building2 className="h-5 w-5" /></span>
                <div><p className="font-semibold">Empresas</p><p className="mt-1 text-sm leading-6 text-white/90">Gestioná tus ofertas y los perfiles derivados por la Oficina.</p></div>
              </div>
            </div>

            <div className="mt-7 flex items-start gap-3 border-t border-white/20 pt-5 lg:mt-8">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-400" aria-hidden="true" />
              <p className="text-sm leading-6 text-white/90">La Oficina de Empleo evalúa las postulaciones y decide qué perfiles compartir con cada empresa.</p>
            </div>
          </section>

          <section aria-labelledby="login-title" className="order-1 min-w-0 lg:order-2">
            <Card className="p-6 sm:p-8 lg:p-10">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary" aria-hidden="true"><KeyRound className="h-5 w-5" /></span>
              <h1 id="login-title" className="mt-5 text-3xl font-bold tracking-tight text-primary-900">Iniciar sesión</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Usá tu cuenta individual y tu correo verificado.</p>

              <div className="mt-6 [&_form]:mt-0 [&_form]:gap-4 [&_label]:text-sm [&_label]:text-foreground [&_input]:min-h-12 [&_input]:rounded-lg [&_input]:border-border [&_input]:text-base [&_input]:text-foreground [&_input]:transition-colors [&_input:hover]:border-primary-500 [&_input:focus-visible]:border-primary [&_button]:min-h-12 [&_button]:rounded-lg [&_button]:bg-primary [&_button]:text-sm [&_button]:transition-colors [&_button:hover:not(:disabled)]:bg-primary-700 [&_button:disabled]:cursor-not-allowed [&_p]:leading-6 [&_p]:text-muted-foreground [&_[role=status]]:text-primary-700 [&_[role=status]:not(:empty)]:rounded-lg [&_[role=status]:not(:empty)]:bg-secondary [&_[role=status]:not(:empty)]:p-3">
                <AuthForm mode="login" />
              </div>

              <nav aria-label="Ayuda para acceder" className="mt-4 grid gap-2 border-t border-border pt-4 sm:flex sm:flex-wrap sm:justify-between sm:gap-x-4">
                <Link href="/recover" className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-900">
                  <KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Recuperar acceso
                </Link>
                <Link href="/verification-pending" className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-900">
                  <MailCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Necesito verificar mi correo
                </Link>
              </nav>
            </Card>

            <div className="mt-5 rounded-xl border border-border px-6 py-5">
              <h2 className="text-base font-bold text-primary-900">¿Todavía no tenés cuenta?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Elegí cómo querés participar en el portal.</p>
              <nav aria-label="Crear una cuenta" className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link href="/registro/candidato" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-secondary">
                  <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Soy postulante
                </Link>
                <Link href="/registro/empresa" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-secondary">
                  <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Soy empresa
                </Link>
              </nav>
            </div>
          </section>
        </div>
        <p className="mt-7 text-center text-xs leading-5 text-muted-foreground">Oficina de Empleo de Funes · Entorno de prueba</p>
      </div>
    </main>
  );
}
