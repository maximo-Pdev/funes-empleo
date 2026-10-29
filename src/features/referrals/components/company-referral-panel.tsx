import { formatFunesDateTime } from "@/lib/time/presentation";
import { availabilityLabel, interviewStatusLabels, displayLabel } from "@/domain/presentation/labels";
import { availabilityTones, interviewStatusTones, statusTone } from "@/domain/presentation/status-tone";
import { RecordLink as Link, RecordLabel } from "@/components/ui/record-link";
import { Badge } from "@/components/ui";
import type { CompanyReferral } from "@/features/referrals/service";
import { FeedbackForm, InterviewForm } from "./referral-forms";

export function CompanyReferralPanel({ referral, openingId }: { referral: CompanyReferral; openingId: string }) {
  const candidate = referral.candidate;
  const candidateName = referral.candidateName ?? candidate?.displayName ?? referral.hiredCandidate?.displayName;
  return (
    <section aria-labelledby="detalle-derivacion" className="rounded-lg border border-slate-300 bg-white p-5">
      <h2 id="detalle-derivacion" className="break-words text-xl font-semibold">{candidateName ? `Derivación de ${candidateName}` : <>Derivación <RecordLabel kind="referral" id={referral.referralId} /></>}</h2>
      {candidateName && <p className="mt-2 break-all text-xs text-slate-700">Referencia: <RecordLabel kind="referral" id={referral.referralId} /></p>}
      <p className="mt-2 text-sm text-slate-700">Oferta: {referral.openingTitle ?? "Oferta sin título"}</p>
      <p className="text-sm text-slate-700">Fecha de derivación: {formatFunesDateTime(referral.referredAt, { seconds: false })}</p>
      {referral.hiredCandidate && <p className="mt-4 font-semibold">Contratado</p>}
      {candidate ? (
        <div className="mt-6 space-y-5">
          <div>
            <h3 className="text-lg font-semibold">Perfil laboral derivado</h3>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              <div><dt className="font-semibold">Localidad</dt><dd>{candidate.locality ?? "No informada"}</dd></div>
              <div><dt className="font-semibold">Disponibilidad</dt><dd><Badge variant="status" tone={statusTone(availabilityTones, candidate.availability)}>{availabilityLabel(candidate.availability)}</Badge></dd></div>
              <div><dt className="font-semibold">Experiencia y habilidades</dt><dd className="whitespace-pre-wrap">{candidate.skillsExperienceSummary ?? "No informadas"}</dd></div>
            </dl>
            <h4 className="mt-4 font-semibold">Categorías laborales</h4>
            {candidate.categories.length ? <ul className="list-disc pl-6">{candidate.categories.map((category, index) => <li key={`${category.name}-${index}`}>{category.name}</li>)}</ul> : <p>No se informaron categorías.</p>}
          </div>
          <div>
            <h3 className="text-lg font-semibold">Contactos vigentes</h3>
            {candidate.contacts.length ? <ul className="mt-2 list-disc pl-6">{candidate.contacts.map((contact, index) => <li key={`${contact.kind}-${index}`}><span className="font-medium">{contact.kind === "email" ? "Correo" : contact.kind === "phone" ? "Teléfono" : "Otro contacto"}:</span> {contact.value}</li>)}</ul> : <p>No hay contactos vigentes para mostrar.</p>}
          </div>
          <Link href={`/api/cv/${candidate.cvDocumentId}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-md bg-blue-800 px-4 py-2 font-semibold text-white underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Abrir CV asociado a esta derivación en otra pestaña</Link>
          <p className="text-sm text-slate-700">El acceso puede revocarse en cualquier momento. Una copia ya descargada no puede retirarse técnicamente.</p>
          <div>
            <h3 className="text-lg font-semibold">Entrevistas registradas</h3>
            {referral.interviews?.length ? <ul className="mt-2 grid gap-2">{referral.interviews.map((interview) => <li key={interview.id} className="flex flex-wrap items-center gap-2"><Badge variant="status" tone={statusTone(interviewStatusTones, interview.status)}>{displayLabel(interviewStatusLabels, interview.status)}</Badge>{interview.scheduledAt ? formatFunesDateTime(interview.scheduledAt) : "sin fecha programada"}{interview.companyMessage ? ` — ${interview.companyMessage}` : ""}</li>)}</ul> : <p>Aún no hay entrevistas registradas.</p>}
          </div>
          {referral.participationVersion && <InterviewForm openingId={openingId} referralId={referral.referralId} version={referral.participationVersion} />}
        </div>
      ) : (
        <p role="status" className="mt-5 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
          {referral.hiredCandidate ? "La contratación fue confirmada. Se conserva únicamente el nombre; el perfil, los contactos y el CV ya no están disponibles." : candidateName ? "El acceso al perfil de esta persona finalizó. Se conserva únicamente su nombre para identificar esta derivación; sus contactos, foto y CV ya no están disponibles." : "El acceso al perfil de esta persona finalizó. No hay un nombre disponible para identificar esta derivación. Consultá a la Oficina de Empleo antes de informar un resultado."}
        </p>
      )}
      {!referral.hiredCandidate && <div className="mt-6">
        <FeedbackForm openingId={openingId} referralId={referral.referralId} />
      </div>}
    </section>
  );
}
