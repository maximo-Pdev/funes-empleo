import { recordReferences } from "@/lib/records/references";
import { pageRecordIdentifier } from "@/lib/records/page-references";
import { RecordLink as Link } from "@/components/ui/record-link";
import { openingStatusLabels, displayLabel } from "@/domain/presentation/labels";
import { publicModalityLabel, publicContractTypeLabel } from "@/features/openings/public-offer-display";
import { Suspense } from "react";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { ModerationHistory } from "@/features/openings/components/moderation-history";
import { getAdminOpening } from "@/features/openings/admin-service";
import { moderateOpeningAction } from "@/features/openings/admin-actions";
import { ModerationForm } from "@/features/openings/components/moderation-form";
import { requireActiveAccount } from "@/lib/auth/guards";
import { OpeningCandidateMatches } from "@/features/participations/components/opening-candidate-matches";

export const dynamic = "force-dynamic";

export default async function AdminOpeningDetailPage({ params, searchParams }: {
  params: Promise<{ openingId: string }>;
  searchParams: Promise<{ matchPage?: string | string[] }>;
}) {
  const { user } = await requireActiveAccount(["admin"]);
  const { openingId: reference } = await params;
  const openingId = await pageRecordIdentifier("opening", reference, `/admin/openings/${reference}`, await searchParams);
  const { matchPage } = await searchParams;
  const { opening, events } = await getAdminOpening(openingId);

  const actors = await recordReferences("account", events.map(event => event.actor_account_id));

  return <AdminShell email={user?.email} active="/admin/openings" title={opening.title ?? "Oferta sin título"}
    description="Detalle e historial de decisiones visible solo para la Oficina de Empleo."
    navigation={[{ href: "/admin/openings", label: "Volver a ofertas" }, { href: "/admin/candidates", label: "Candidatos" }]}>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
      <section aria-labelledby="opening-details" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
        <h2 id="opening-details" className="text-xl font-semibold">Oferta y empresa</h2>
        <p>Empresa: <strong>{opening.company_profiles?.legal_name ?? "Sin nombre"}</strong></p>
        <p>Estado: <strong>{displayLabel(openingStatusLabels, opening.status)}</strong></p>
        <p>Fecha de cierre: {opening.closing_date ?? "Sin definir"}</p>
        <p>Vacantes: {opening.vacancies ?? "Sin definir"}</p>
        <p>Localidad: {opening.location ?? "Sin definir"}</p>
        <p>Modalidad: {publicModalityLabel(opening.modality ?? "Sin definir")}</p>
        <p>Jornada: {opening.schedule ?? "Sin definir"}</p>
        <p>Contrato: {publicContractTypeLabel(opening.contract_type ?? "Sin definir")}</p>
        <div><h3 className="font-semibold">Tareas</h3><p className="whitespace-pre-wrap">{opening.tasks ?? "Sin definir"}</p></div>
        <div><h3 className="font-semibold">Requisitos</h3><p className="whitespace-pre-wrap">{opening.requirements ?? "Sin definir"}</p></div>
        <Link href={`/admin/participations?openingId=${opening.id}`} className="inline-block text-blue-800 underline">Ver participaciones de esta oferta</Link>
      </section>
      <ModerationForm key={`${opening.status}-${opening.version}`} openingId={opening.id}
        version={opening.version} status={opening.status} onSubmit={moderateOpeningAction} />
      </div>
      <ModerationHistory key={`${opening.id}:${opening.version}`} events={events.map(event => ({
        id: event.id, decision: event.decision, previousStatus: event.previous_status, newStatus: event.new_status,
        at: event.created_at, message: event.company_message, internalReason: event.internal_reason,
        actorLabel: event.actor_type === "system" ? "Sistema" : `Cuenta ${(event.actor_account_id ? actors[event.actor_account_id] : undefined) ?? "sin identificar"}`,
      }))} />
    </div>
    <Suspense key={Array.isArray(matchPage) ? matchPage.join(",") : matchPage ?? "1"}
      fallback={<p role="status">Buscando candidatos con rubros coincidentes…</p>}>
      <OpeningCandidateMatches openingId={opening.id} page={matchPage} />
    </Suspense>
  </AdminShell>;
}
