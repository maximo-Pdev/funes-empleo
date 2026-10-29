import { formatFunesDate, formatFunesDateTime } from "@/lib/time/presentation";
import Link from "next/link";
import { RecordAnchor } from "@/components/ui/record-link";
import { ArrowRight, CalendarDays, ClipboardList } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import styles from "../_components/candidate-forms.module.css";
import { listMyParticipations } from "@/features/participations/candidate-service";
import { CandidateWithdrawForm } from "@/features/participations/components/candidate-status";
import { candidateStatusLabels } from "@/features/participations/candidate-status-labels";
import { participationStatusTones, statusTone } from "@/domain/presentation/status-tone";
import { recordReferences } from "@/lib/records/references";
import { candidatePreinterviewAgenda } from "@/features/notifications/service";
import { preinterviewChannelLabels } from "@/features/notifications/contracts";

export async function renderCandidateParticipationsContent({ offersHref = "/dashboard?section=ofertas" }: { offersHref?: string } = {}) {
  const items = await listMyParticipations();
  const [references, agenda] = await Promise.all([recordReferences("participation", items.map(item => item.id)), candidatePreinterviewAgenda()]);
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? "participación registrada" : "participaciones registradas"}</p><Link href={offersHref} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-primary hover:bg-secondary">Explorar ofertas<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
    {items.length === 0 ? <Card className="p-8 text-center sm:p-12"><ClipboardList className="mx-auto h-10 w-10 text-primary" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold text-primary-900">Todavía no tenés participaciones.</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Cuando te postules o la Oficina te asocie a una oferta, podrás consultar la recepción y el resultado en este espacio.</p><Link href={offersHref} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-700">Ver ofertas disponibles<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Card> :
      <ul className="grid gap-5 md:grid-cols-2">{items.map((item) => <li key={item.id} id={references[item.id]} tabIndex={-1} className="min-w-0 scroll-mt-28 rounded-lg target:outline target:outline-2 target:outline-offset-4 target:outline-primary">
        <Card className="h-full p-6"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary"><ClipboardList className="h-5 w-5" aria-hidden="true" /></div>
          <h2 className="break-words text-xl font-bold leading-7 text-primary-900">{item.opening_title ?? "Oferta"}</h2>
          <p className="mt-4 text-sm"><span className="sr-only">Estado: </span><Badge variant="status" tone={statusTone(participationStatusTones, item.display_status)}><span className="min-w-0 break-words">{candidateStatusLabels[item.display_status] ?? "Resultado registrado"}</span></Badge></p>
          <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-muted-foreground"><CalendarDays className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Recibida: {formatFunesDate(item.created_at)}</p>
          {agenda.filter(entry => entry.reference === references[item.id]).map((entry, index) => <div key={`${entry.reference}-${index}`} className="mt-4 rounded-lg border border-border bg-secondary p-3 text-sm">
            <h3 className="font-semibold">Preentrevista de la Oficina de Empleo</h3>
            <p>Canal: {preinterviewChannelLabels[entry.channel]}</p>
            {entry.scheduledAt && <p>Programada: {formatFunesDateTime(entry.scheduledAt)}</p>}
            {entry.heldAt && <p>Realizada: {formatFunesDateTime(entry.heldAt)}</p>}
          </div>)}
          {item.cv_document_id && <p className="mt-4"><RecordAnchor href={`/api/cv/${item.cv_document_id}`} target="_blank" rel="noopener noreferrer" className="text-primary underline">Abrir CV de esta postulación: {item.cv_name}</RecordAnchor></p>}
          {item.display_status === "received" && <div className={`${styles.forms} mt-5 border-t border-border pt-3`}><CandidateWithdrawForm participationId={item.id} version={item.version} /></div>}
        </Card>
      </li>)}</ul>}
  </>;
}
