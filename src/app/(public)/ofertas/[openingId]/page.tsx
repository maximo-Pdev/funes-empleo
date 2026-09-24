import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicOffer } from "@/features/openings/public-service";
import { AppError } from "@/lib/errors/public-error";

export const dynamic = "force-dynamic";
export default async function PublicOfferDetailPage({ params }: { params: Promise<{ openingId: string }> }) {
  const { openingId } = await params;
  let offer;
  try { offer = await getPublicOffer(openingId); }
  catch (error) { if (error instanceof AppError && error.code === "NOT_FOUND") notFound(); throw error; }
  return <main id="contenido" className="mx-auto max-w-3xl px-4 py-10">
    <Link href="/ofertas" className="text-blue-800 underline">Volver a ofertas</Link>
    <h1 className="mt-5 text-3xl font-bold">{offer.title}</h1>
    <p className="mt-2">{offer.company_name}</p>
    <dl className="mt-8 grid gap-4 rounded border bg-white p-5">
      <div><dt className="font-semibold">Tareas</dt><dd className="whitespace-pre-wrap">{offer.tasks}</dd></div>
      <div><dt className="font-semibold">Requisitos</dt><dd className="whitespace-pre-wrap">{offer.requirements}</dd></div>
      <div><dt className="font-semibold">Categorías</dt><dd>{offer.categories.map((item) => item.name).join(", ")}</dd></div>
      <div><dt className="font-semibold">Vacantes</dt><dd>{offer.vacancies}</dd></div>
      <div><dt className="font-semibold">Ubicación</dt><dd>{offer.location}</dd></div>
      <div><dt className="font-semibold">Modalidad</dt><dd>{offer.modality}</dd></div>
      <div><dt className="font-semibold">Horario</dt><dd>{offer.schedule}</dd></div>
      <div><dt className="font-semibold">Contratación</dt><dd>{offer.contract_type}</dd></div>
      <div><dt className="font-semibold">Fecha de cierre</dt><dd>{offer.closing_date}</dd></div>
      {offer.salary && <div><dt className="font-semibold">Salario</dt><dd>{offer.salary}</dd></div>}
      {offer.benefits && <div><dt className="font-semibold">Beneficios</dt><dd>{offer.benefits}</dd></div>}
    </dl>
    <Link className="mt-8 inline-block rounded bg-blue-800 p-3 text-white" href={`/candidato/ofertas?oferta=${offer.id}`}>Postularme con mi cuenta</Link>
  </main>;
}
