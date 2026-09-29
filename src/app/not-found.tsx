import Link from "next/link";

export default function NotFound() {
  return (
    <main id="contenido" className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">No encontramos la página</h1>
      <p className="mt-4 text-slate-700">El recurso solicitado no está disponible o no tenés permiso para verlo.</p>
      <Link href="/ofertas" className="mt-6 inline-block text-blue-800 underline">Volver a las ofertas publicadas</Link>
    </main>
  );
}
