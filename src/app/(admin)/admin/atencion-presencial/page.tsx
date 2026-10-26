import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { RecordLink as Link } from "@/components/ui/record-link";
import { EmptyState, FeedbackMessage, Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui";
import { requireActiveAccount } from "@/lib/auth/guards";
import { referenceFilters } from "@/lib/records/page-references";
import { referenceUrl } from "@/lib/records/reference-url";
import { recordReferences } from "@/lib/records/references";
import { searchAssistedCandidates, listCandidateSearchCategories } from "@/features/candidates/search-service";
import { CandidateSearchForm } from "@/features/participations/components/candidate-search-form";
import { AssistedProfileForm } from "@/features/candidates/components/assisted/assisted-forms";
import { getAssistedCreationPolicy } from "@/features/candidates/assisted-service";
import { candidateSearchSchema } from "@/validation/candidate-search";
import { availabilityLabel, candidateProfileStatusLabels, displayLabel } from "@/domain/presentation/labels";
import { availabilityTones, candidateProfileStatusTones, statusTone } from "@/domain/presentation/status-tone";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";
type SearchParams = Record<string, string | string[] | undefined>;

export default async function AssistedCandidatesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireActiveAccount(["admin"]);
  const raw = await referenceFilters("/admin/atencion-presencial", await searchParams, { categoryId: "category" });
  const parsed = candidateSearchSchema.safeParse({ vigency: "all", eligibility: "all", ...raw });
  const [categories, creationPolicy] = await Promise.all([listCandidateSearchCategories(), getAssistedCreationPolicy()]);
  const references = await recordReferences("category", categories.map(category => category.id));
  const results = parsed.success ? await searchAssistedCandidates(parsed.data) : null;
  const pageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (parsed.success) for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    params.set("page", String(page));
    return referenceUrl(`/admin/atencion-presencial?${params.toString()}`);
  };

  return <AdminShell active="/admin/atencion-presencial" title="Perfil asistido"
    description="Creá un perfil mediante atención presencial o consultá los ya creados, incluidos quienes vincularon una cuenta.">
    <section aria-label="Crear perfil presencial" className="mb-8">
      <AssistedProfileForm categories={categories} creationPolicy={creationPolicy} />
    </section>
    <h2 className="mb-4 text-xl font-semibold">Perfiles creados</h2>
    <CandidateSearchForm destination="/admin/atencion-presencial"
      categories={categories.map(category => ({ id: category.id, name: category.name, reference: references[category.id]! }))}
      initial={parsed.success ? parsed.data : { vigency: "all", eligibility: "all" }} />
    {!parsed.success && <div className="mt-5"><FeedbackMessage tone="error">Revisá los filtros y volvé a buscar. No se aceptan caracteres especiales en los términos.</FeedbackMessage></div>}
    {results && <section aria-label="Perfiles de atención presencial" className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold">Perfiles: {results.total}</h2>
      {results.items.length === 0 ? <EmptyState title="Sin perfiles de atención presencial"
        description="No encontramos perfiles para estos filtros. Podés ampliar la búsqueda o iniciar una nueva atención presencial." /> :
        <ul className="grid gap-3 md:grid-cols-2">{results.items.map(candidate => <li key={candidate.id} className="rounded-lg border border-border bg-surface p-5">
          <h3 className="text-lg font-semibold"><Link href={`/admin/candidates/${candidate.id}`} className="text-primary underline underline-offset-4">{candidate.displayName}</Link></h3>
          <p className="mt-1 flex flex-wrap items-center gap-2">Estado <Badge variant="status" tone={statusTone(candidateProfileStatusTones, candidate.status)}>{displayLabel(candidateProfileStatusLabels, candidate.status)}</Badge></p>
          <p className="mt-1 flex flex-wrap items-center gap-2">{candidate.locality ?? "Localidad no informada"} <Badge variant="status" tone={statusTone(availabilityTones, candidate.availability)}>{availabilityLabel(candidate.availability)}</Badge></p>
          <p className="mt-1 text-sm">{candidate.categories.map(category => category.name).join(", ") || "Sin categorías activas"}</p>
          <p className="mt-2 text-sm">{candidate.referralEligible ? "Apto para evaluar derivación" : "No apto para nueva derivación"}</p>
        </li>)}</ul>}
      {results.pageCount > 1 && <Pagination aria-label="Páginas de atención presencial">
        <PaginationContent>
          {results.page > 1 && <PaginationItem><PaginationPrevious href={await pageUrl(results.page - 1)} /></PaginationItem>}
          <PaginationItem><span className="px-3 text-sm">Página {results.page} de {results.pageCount}</span></PaginationItem>
          {results.page < results.pageCount && <PaginationItem><PaginationNext href={await pageUrl(results.page + 1)} /></PaginationItem>}
        </PaginationContent>
      </Pagination>}
    </section>}
  </AdminShell>;
}
