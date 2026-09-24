import Link from "next/link";
import { listPublicOffers } from "@/features/openings/public-service";

export const dynamic = "force-dynamic";
export default async function PublicOffersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const result = await listPublicOffers({ page: page ?? 1 });
  return <main id="contenido" className="mx-auto max-w-5xl px-4 py-10">
    <h1 className="text-3xl font-bold">Ofertas laborales vigentes</h1>
    <p className="mt-2">Solo se muestran ofertas aprobadas y dentro de su fecha de cierre.</p>
    {result.items.length === 0 ? <p className="mt-8 rounded border p-5">No hay ofertas vigentes en esta página.</p> :
      <ul className="mt-8 grid gap-4">{result.items.map((offer) => <li key={offer.id} className="rounded border bg-white p-5">
        <Link className="text-xl font-semibold text-blue-800 underline" href={`/ofertas/${offer.id}`}>{offer.title}</Link>
        <p>{offer.company_name} · {offer.location} · Cierre: {offer.closing_date}</p>
        <p>Categorías: {offer.categories.map((category) => category.name).join(", ") || "Sin categorías"}</p>
      </li>)}</ul>}
    <nav aria-label="Páginas de ofertas" className="mt-8 flex gap-5">
      {result.page > 1 && <Link className="text-blue-800 underline" href={`/ofertas?page=${result.page - 1}`}>Anterior</Link>}
      {result.page * result.pageSize < result.total && <Link className="text-blue-800 underline" href={`/ofertas?page=${result.page + 1}`}>Siguiente</Link>}
    </nav>
  </main>;
}
