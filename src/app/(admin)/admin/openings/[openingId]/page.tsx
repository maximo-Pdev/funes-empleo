import Link from "next/link";
import { RoleShell } from "@/components/layouts";
import { EmptyState } from "@/components/ui";
import { getAdminOpening } from "@/features/openings/admin-service";
import { moderateOpeningAction } from "@/features/openings/admin-actions";
import { ModerationForm } from "@/features/openings/components/moderation-form";
import { requireActiveAccount } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AdminOpeningDetailPage({ params }: {
  params: Promise<{ openingId: string }>;
}) {
  await requireActiveAccount(["admin"]);
  const { openingId } = await params;
  const { opening, events } = await getAdminOpening(openingId);

  return <RoleShell role="admin" title={opening.title ?? "Oferta sin título"}
    description="Detalle e historial de decisiones visible solo para la Oficina de Empleo."
    navigation={[{ href: "/admin/openings", label: "Volver a ofertas" }, { href: "/admin/candidates", label: "Candidatos" }]}>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
      <section aria-labelledby="opening-details" className="space-y-3 rounded-lg border border-slate-300 bg-white p-5">
        <h2 id="opening-details" className="text-xl font-semibold">Oferta y empresa</h2>
        <p>Empresa: <strong>{opening.company_profiles?.legal_name ?? "Sin nombre"}</strong></p>
        <p>Estado: <strong>{opening.status.replaceAll("_", " ")}</strong></p>
        <p>Fecha de cierre: {opening.closing_date ?? "Sin definir"}</p>
        <p>Vacantes: {opening.vacancies ?? "Sin definir"}</p>
        <p>Localidad: {opening.location ?? "Sin definir"}</p>
        <p>Modalidad: {opening.modality ?? "Sin definir"}</p>
        <p>Jornada: {opening.schedule ?? "Sin definir"}</p>
        <p>Contrato: {opening.contract_type ?? "Sin definir"}</p>
        <div><h3 className="font-semibold">Tareas</h3><p className="whitespace-pre-wrap">{opening.tasks ?? "Sin definir"}</p></div>
        <div><h3 className="font-semibold">Requisitos</h3><p className="whitespace-pre-wrap">{opening.requirements ?? "Sin definir"}</p></div>
        <Link href={`/admin/participations?openingId=${opening.id}`} className="inline-block text-blue-800 underline">Ver participaciones de esta oferta</Link>
      </section>
      <ModerationForm key={`${opening.status}-${opening.version}`} openingId={opening.id}
        version={opening.version} status={opening.status} onSubmit={moderateOpeningAction} />
      </div>
      <section aria-labelledby="opening-history" className="space-y-4">
        <h2 id="opening-history" className="text-xl font-semibold">Historial de moderación</h2>
        {events.length === 0 ? <EmptyState title="Sin decisiones registradas" description="Todavía no hay eventos de moderación para esta oferta." /> :
          <ol className="space-y-3">{events.map((event) => <li key={event.id} className="rounded-lg border border-slate-300 bg-white p-4">
            <p className="font-semibold">{event.decision.replaceAll("_", " ")}: {event.previous_status ?? "inicio"} → {event.new_status}</p>
            <p className="text-sm text-slate-700">{new Date(event.created_at).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires" })} · {event.actor_type === "system" ? "Sistema" : `Cuenta ${event.actor_account_id ?? "sin identificar"}`}</p>
            {event.company_message && <p className="mt-2">Mensaje a empresa: {event.company_message}</p>}
            {event.internal_reason && <p className="mt-2">Motivo interno: {event.internal_reason}</p>}
          </li>)}</ol>}
      </section>
    </div>
  </RoleShell>;
}
