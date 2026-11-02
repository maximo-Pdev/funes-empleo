import { referenceFilters } from "@/lib/records/page-references";
import { CategoryLabels } from "@/components/job-category-label";
import { referenceUrl } from "@/lib/records/reference-url";
import { recordReferences } from "@/lib/records/references";
import { RecordLink as Link } from "@/components/ui/record-link";
import { availabilityLabel } from "@/domain/presentation/labels";
import { availabilityTones, statusTone } from "@/domain/presentation/status-tone";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { Badge, EmptyState, FeedbackMessage, Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { CandidateSearchForm } from "@/features/participations/components/candidate-search-form";
import { listCandidateSearchCategories, searchCandidates } from "@/features/candidates/search-service";
import { requireActiveAccount } from "@/lib/auth/guards";
import { candidateSearchSchema } from "@/validation/candidate-search";
import { RECORD_PAGE_SIZE } from "@/lib/collections/limits";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminCandidatesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { user } = await requireActiveAccount(["admin"]);
  const raw = await referenceFilters("/admin/candidates", await searchParams, { categoryId: "category" });
  const parsed = candidateSearchSchema.safeParse({ ...raw, pageSize: RECORD_PAGE_SIZE });
  const categories = await listCandidateSearchCategories();
  const categoryReferences = await recordReferences("category", categories.map(category => category.id));
  const results = parsed.success ? await searchCandidates(parsed.data) : null;
  const pageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (parsed.success) for (const [key, value] of Object.entries(parsed.data)) {
      if (key === "categoryId") {
        for (const id of value as string[]) params.append("categoryId", id);
        continue;
      }
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    params.set("page", String(page));
    return referenceUrl(`/admin/candidates?${params.toString()}`);
  };

  return <AdminShell email={user?.email} active="/admin/candidates" title="Buscar candidatos" description="Solo la Oficina de Empleo consulta el padrón y decide las derivaciones."
    navigation={[{ href: "/admin/openings", label: "Ofertas" }, { href: "/admin/participations", label: "Participaciones" }, { href: "/admin/metrics", label: "Métricas" }, { href: "/account", label: "Cuenta" }]}>
    <CandidateSearchForm categories={categories.map((category) => ({ id: category.id, name: category.name, reference: categoryReferences[category.id]! }))}
      initial={parsed.success ? parsed.data : undefined} />
    {!parsed.success && <div className="mt-5"><FeedbackMessage tone="error">Revisá los filtros y volvé a buscar. No se aceptan caracteres especiales en los términos.</FeedbackMessage></div>}
    {results && <section aria-label="Resultados de búsqueda" className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold">Resultados: {results.total}</h2>
      {results.items.length === 0 ? <EmptyState title="Sin candidatos" description="No encontramos perfiles para estos filtros. Probá ampliarlos." /> :
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidato</TableHead>
                <TableHead>Localidad</TableHead>
                <TableHead>Disponibilidad</TableHead>
                <TableHead>Categorías</TableHead>
                <TableHead>Aptitud para derivación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.items.map((candidate) => <TableRow key={candidate.id}>
                <TableCell className="font-semibold"><Link className="text-blue-800 underline" href={`/admin/candidates/${candidate.id}`}>{candidate.displayName}</Link></TableCell>
                <TableCell>{candidate.locality ?? "Localidad no informada"}</TableCell>
                <TableCell><Badge variant="status" tone={statusTone(availabilityTones, candidate.availability)}>{availabilityLabel(candidate.availability)}</Badge></TableCell>
                <TableCell><CategoryLabels categories={candidate.categories} fallback="Sin categorías activas" /></TableCell>
                <TableCell>{candidate.referralEligible ? "Apto para evaluar derivación" : "No apto para nueva derivación"}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </div>}
      {results.pageCount > 1 && <Pagination aria-label="Páginas de candidatos">
        <PaginationContent>
          {results.page > 1 && <PaginationItem><PaginationPrevious href={await pageUrl(results.page - 1)} /></PaginationItem>}
          <PaginationItem><span className="px-3 text-sm">Página {results.page} de {results.pageCount}</span></PaginationItem>
          {results.page < results.pageCount && <PaginationItem><PaginationNext href={await pageUrl(results.page + 1)} /></PaginationItem>}
        </PaginationContent>
      </Pagination>}
    </section>}
  </AdminShell>;
}
