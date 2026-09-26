import Link from "next/link";
import { RoleShell } from "@/components/layouts";
import { EmptyState, FeedbackMessage } from "@/components/ui";
import { CandidateSearchForm } from "@/features/participations/components/candidate-search-form";
import { listCandidateSearchCategories, searchCandidates } from "@/features/candidates/search-service";
import { requireActiveAccount } from "@/lib/auth/guards";
import { candidateSearchSchema } from "@/validation/candidate-search";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminCandidatesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireActiveAccount(["admin"]);
  const raw = await searchParams;
  const parsed = candidateSearchSchema.safeParse(raw);
  const categories = await listCandidateSearchCategories();
  const results = parsed.success ? await searchCandidates(parsed.data) : null;
  const pageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (parsed.success) for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    params.set("page", String(page));
    return `/admin/candidates?${params.toString()}`;
  };

  return <RoleShell role="admin" title="Buscar candidatos" description="Solo la Oficina de Empleo consulta el padrón y decide las derivaciones."
    navigation={[{ href: "/admin/openings", label: "Ofertas" }, { href: "/admin/participations", label: "Participaciones" }, { href: "/admin/imports", label: "Importaciones" }, { href: "/account", label: "Mi cuenta" }]}>
    <Link href="/admin/candidates/assisted" className="inline-block rounded bg-blue-800 p-3 text-white">Nueva atención presencial</Link>
    <CandidateSearchForm categories={categories.map((category) => ({ id: category.id, name: category.name }))}
      initial={parsed.success ? parsed.data : undefined} />
    {!parsed.success && <div className="mt-5"><FeedbackMessage tone="error">Revisá los filtros y volvé a buscar. No se aceptan caracteres especiales en los términos.</FeedbackMessage></div>}
    {results && <section aria-label="Resultados de búsqueda" className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold">Resultados: {results.total}</h2>
      {results.items.length === 0 ? <EmptyState title="Sin candidatos" description="No encontramos perfiles para estos filtros. Probá ampliarlos." /> :
        <ul className="grid gap-3 md:grid-cols-2">
          {results.items.map((candidate) => <li key={candidate.id} className="rounded-lg border border-slate-300 bg-white p-5">
            <h3 className="text-lg font-semibold"><Link className="text-blue-800 underline" href={`/admin/candidates/${candidate.id}`}>{candidate.displayName}</Link></h3>
            <p className="mt-1">{candidate.locality ?? "Localidad no informada"} · {candidate.availability ?? "Disponibilidad no informada"}</p>
            <p className="mt-1 text-sm">{candidate.categories.length ? candidate.categories.map((category) => category.name).join(", ") : "Sin categorías activas"}</p>
            <p className="mt-2 font-medium">{candidate.referralEligible ? "Apto para evaluar derivación" : "No apto para nueva derivación"}</p>
          </li>)}
        </ul>}
      {results.pageCount > 1 && <nav aria-label="Páginas de candidatos" className="flex items-center gap-4">
        {results.page > 1 && <Link className="text-blue-800 underline" href={pageUrl(results.page - 1)}>Anterior</Link>}
        <span>Página {results.page} de {results.pageCount}</span>
        {results.page < results.pageCount && <Link className="text-blue-800 underline" href={pageUrl(results.page + 1)}>Siguiente</Link>}
      </nav>}
    </section>}
  </RoleShell>;
}
