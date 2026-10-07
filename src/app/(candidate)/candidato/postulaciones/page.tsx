import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { CandidateShell } from "../_components/candidate-shell";
import styles from "../_components/candidate-forms.module.css";
import { requireActiveAccount } from "@/lib/auth/guards";
import { listMyParticipations } from "@/features/participations/candidate-service";
import { CandidateWithdrawForm } from "@/features/participations/components/candidate-status";
import { candidateStatusLabels } from "@/features/participations/candidate-status-labels";

export const dynamic = "force-dynamic";
export default async function CandidateParticipationsPage() {
  await requireActiveAccount(["candidate"]);
  const items = await listMyParticipations();
  return <CandidateShell title="Mis participaciones" active="/candidato/postulaciones"
    description="La Oficina de Empleo revisa cada caso. Se muestra la recepción y el resultado final, sin etapas internas.">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? "participación registrada" : "participaciones registradas"}</p><Link href="/candidato/ofertas" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-primary hover:bg-secondary">Explorar ofertas<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
    {items.length === 0 ? <Card className="p-8 text-center sm:p-12"><ClipboardList className="mx-auto h-10 w-10 text-primary" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold text-primary-900">Todavía no tenés participaciones.</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Cuando te postules o la Oficina te asocie a una oferta, podrás consultar la recepción y el resultado en este espacio.</p><Link href="/candidato/ofertas" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-700">Ver ofertas disponibles<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Card> :
      <ul className="grid gap-5 md:grid-cols-2">{items.map((item) => <li key={item.id} className="min-w-0">
        <Card className="h-full p-6"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary"><ClipboardList className="h-5 w-5" aria-hidden="true" /></div>
          <h2 className="break-words text-xl font-bold leading-7 text-primary-900">{item.opening_title ?? "Oferta"}</h2>
          <p className="mt-4 text-sm"><span className="sr-only">Estado: </span><Badge><span className="min-w-0 break-words">{candidateStatusLabels[item.display_status] ?? "Resultado registrado"}</span></Badge></p>
          <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-muted-foreground"><CalendarDays className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Recibida: {new Date(item.created_at).toLocaleDateString("es-AR")}</p>
          {item.display_status === "received" && <div className={`${styles.forms} mt-5 border-t border-border pt-3`}><CandidateWithdrawForm participationId={item.id} version={item.version} /></div>}
        </Card>
      </li>)}</ul>}
  </CandidateShell>;
}
