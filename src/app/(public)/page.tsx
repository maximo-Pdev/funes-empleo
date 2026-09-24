import Link from "next/link";
export default function HomePage() {
  return (
    <main id="contenido" className="mx-auto max-w-3xl px-6 py-16">
      <p className="mb-4 text-sm font-semibold">Municipalidad de Funes · Oficina de Empleo</p>
      <h1 className="text-3xl font-bold tracking-tight">Portal Municipal de Empleo</h1>
      <p className="mt-6 leading-relaxed">Entorno de desarrollo con datos ficticios.</p>
      <p className="mt-4 leading-relaxed">La Oficina de Empleo acompaña a candidatos y empresas y conserva la intermediación en cada búsqueda laboral.</p>
      <nav aria-label="Accesos" className="mt-8 flex flex-wrap gap-5"><Link className="text-blue-800 underline" href="/ofertas">Ver ofertas vigentes</Link><Link className="text-blue-800 underline" href="/registro/candidato">Registrarme como candidato</Link><Link className="text-blue-800 underline" href="/registro/empresa">Registrarme como empresa</Link><Link className="text-blue-800 underline" href="/login">Iniciar sesión</Link></nav>
    </main>
  );
}
