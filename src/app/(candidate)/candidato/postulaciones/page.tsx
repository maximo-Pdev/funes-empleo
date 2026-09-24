import { RoleShell } from "@/components/layouts";
import { requireActiveAccount } from "@/lib/auth/guards";
import { listMyParticipations } from "@/features/participations/candidate-service";
import { CandidateWithdrawForm } from "@/features/participations/components/candidate-status";
import { candidateStatusLabels } from "@/features/participations/candidate-status-labels";

export const dynamic = "force-dynamic";
export default async function CandidateParticipationsPage() {
  await requireActiveAccount(["candidate"]);
  const items = await listMyParticipations();
  return <RoleShell role="candidate" title="Mis participaciones"
    description="La Oficina de Empleo revisa cada caso. Se muestra la recepción y el resultado final, sin etapas internas."
    navigation={[{ href: "/candidato/perfil", label: "Mi perfil" }, { href: "/candidato/ofertas", label: "Ofertas" }]}>
    {items.length === 0 ? <p className="rounded border p-5">Todavía no tenés participaciones.</p> :
      <ul className="grid gap-4">{items.map((item) => <li key={item.id} className="rounded border bg-white p-5">
        <h2 className="text-lg font-semibold">{item.opening_title ?? "Oferta"}</h2>
        <p>Estado: <strong>{candidateStatusLabels[item.display_status] ?? "Resultado registrado"}</strong></p>
        <p className="text-sm">Recibida: {new Date(item.created_at).toLocaleDateString("es-AR")}</p>
        {item.display_status === "received" && <CandidateWithdrawForm participationId={item.id} version={item.version} />}
      </li>)}</ul>}
  </RoleShell>;
}
