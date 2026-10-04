import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, KeyRound, MailCheck, ShieldCheck, Building2 } from "lucide-react";
import { Card } from "@/components/ui";
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";

export default function CompanyRegistrationPage() {
  return (
    <main id="contenido" tabIndex={-1} className="min-h-screen bg-page text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg font-semibold text-primary-700">
            <Image src="/brand/logo-funes-gris.svg" alt="Municipalidad de Funes — inicio" width={44} height={44} className="h-11 w-11 rounded-lg border border-border bg-surface" />
            <span className="hidden leading-tight sm:block">Municipalidad de Funes<span className="block text-sm font-medium text-muted-foreground">Portal de Empleo</span></span>
          </Link>
          <Link href="/ofertas" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-secondary">Ver ofertas<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pb-14">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-primary-700 hover:underline hover:underline-offset-4"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver al inicio</Link>
        <div className="mt-5 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-8">
          <section aria-labelledby="registration-guide" className="order-2 rounded-2xl bg-primary-900 p-6 text-white sm:p-8 lg:order-1 lg:p-10">
            <div className="flex items-center gap-3">
              <Image src="/brand/logo-funes-verde.svg" alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-xl" />
              <p className="text-sm font-semibold leading-6">Oficina de Empleo<span className="block font-normal text-white/90">Municipalidad de Funes</span></p>
            </div>
            <h2 id="registration-guide" className="mt-7 max-w-md text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Encontrá talento para tu empresa.</h2>
            <p className="mt-5 text-base leading-7 text-white/90">Gestioná tus búsquedas laborales con el acompañamiento de la Oficina de Empleo de Funes.</p>
            <ol className="mt-8 space-y-6" aria-label="Pasos para empezar">
              <li className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold" aria-hidden="true">1</span><div><p className="font-semibold">Creá tu cuenta</p><p className="mt-1 text-sm leading-6 text-white/90">Registrá tu empresa y verificá tu correo para ingresar.</p></div></li>
              <li className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold" aria-hidden="true">2</span><div><p className="font-semibold">Prepará tu oferta</p><p className="mt-1 text-sm leading-6 text-white/90">Guardá un borrador y envialo a revisión municipal antes de su publicación.</p></div></li>
              <li className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold" aria-hidden="true">3</span><div><p className="font-semibold">Recibí perfiles derivados</p><p className="mt-1 text-sm leading-6 text-white/90">La Oficina preselecciona y deriva candidatos para tus ofertas.</p></div></li>
            </ol>
            <div className="mt-7 rounded-xl border border-white/20 bg-white/5 p-4"><p className="text-sm font-semibold">Sin verificación documental en el MVP</p><p className="mt-2 text-sm leading-6 text-white/90">Verificar el correo confirma el acceso a la cuenta; no acredita la identidad de la empresa. Cada oferta requiere revisión municipal.</p></div>
            <div className="mt-8 flex items-start gap-3 border-t border-white/20 pt-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-400" aria-hidden="true" />
              <p className="text-sm leading-6 text-white/90">Las empresas acceden únicamente a los candidatos derivados por la Oficina a sus propias ofertas.</p>
            </div>
          </section>

          <section aria-labelledby="registration-title" className="order-1 min-w-0 lg:order-2">
            <Card className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary" aria-hidden="true"><Building2 className="h-5 w-5" /></span><p className="text-sm font-semibold text-primary-700">Cuenta de empresa</p></div>
              <h1 id="registration-title" className="mt-5 text-3xl font-bold tracking-tight text-primary-900">Registro de empresas</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Completá los datos de tu empresa y de acceso. Todos los campos son obligatorios, salvo el teléfono.</p>
              <div className="mt-6 [&_form]:mt-0 [&_form]:gap-4 sm:[&_form]:grid-cols-2 sm:[&_form>p]:col-span-2 sm:[&_form>button]:col-span-2 [&_label]:min-w-0 [&_label]:font-semibold [&_label]:text-sm [&_label]:text-foreground [&_input]:min-h-12 [&_input]:min-w-0 [&_input]:w-full [&_input]:rounded-lg [&_input]:border-border [&_input]:text-base [&_input]:text-foreground [&_input]:transition-colors [&_input:hover]:border-primary-500 [&_input:focus-visible]:border-primary [&_button]:min-h-12 [&_button]:rounded-lg [&_button]:bg-primary [&_button]:text-sm [&_button]:transition-colors [&_button:hover:not(:disabled)]:bg-primary-700 [&_button:disabled]:cursor-not-allowed [&_p]:text-sm [&_p]:leading-6 [&_p]:text-muted-foreground [&_[role=alert]]:text-accent-violet [&_[role=alert]:not(:empty)]:rounded-lg [&_[role=alert]:not(:empty)]:border [&_[role=alert]:not(:empty)]:border-accent-violet [&_[role=alert]:not(:empty)]:p-3 [&_[role=status]]:text-primary-700 [&_[role=status]:not(:empty)]:rounded-lg [&_[role=status]:not(:empty)]:bg-secondary [&_[role=status]:not(:empty)]:p-3">
                <CompanyRegistrationForm />
              </div>
              <nav aria-label="Acceso" className="mt-5 grid gap-2 border-t border-border pt-4 sm:flex sm:flex-wrap sm:justify-between sm:gap-x-4">
                <Link href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-900">Ya tengo cuenta<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                <Link href="/recover" className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-900"><KeyRound className="h-4 w-4" aria-hidden="true" />Recuperar acceso</Link>
              </nav>
            </Card>
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-surface-muted px-6 py-5">
              <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div><h2 className="text-sm font-bold text-primary-900">¿Ya recibiste el correo?</h2><p className="mt-1 text-sm leading-6 text-foreground">Revisá también la carpeta de spam.</p><Link href="/verification-pending" className="mt-2 inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-900">Ayuda para verificar mi correo</Link></div>
            </div>
          </section>
        </div>
        <p className="mt-7 text-center text-xs leading-5 text-muted-foreground">Oficina de Empleo de Funes · Entorno de prueba</p>
      </div>
    </main>
  );
}
