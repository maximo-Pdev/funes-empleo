import Link from "next/link";
export function AuthPage({ title, children }: { title: string; children: React.ReactNode }) {
  return <main id="contenido" className="mx-auto max-w-xl px-6 py-12">
    <p className="mb-3 text-sm">Oficina de Empleo de Funes · Entorno de prueba</p>
    <h1 className="text-3xl font-bold">{title}</h1>
    {children}
    <nav aria-label="Acceso" className="mt-8 flex flex-wrap gap-4">
      <Link className="text-blue-800 underline" href="/login">Iniciar sesión</Link>
      <Link className="text-blue-800 underline" href="/recover">Recuperar acceso</Link>
      <Link className="text-blue-800 underline" href="/">Volver al inicio</Link>
    </nav>
  </main>;
}
