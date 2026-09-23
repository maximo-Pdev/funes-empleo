import Link from "next/link";
import type { CompanyReferral } from "@/features/referrals/service";
import { FeedbackForm, InterviewForm } from "./referral-forms";

export function CompanyReferralPanel({ referral, openingId }: { referral: CompanyReferral; openingId: string }) {
  const candidate = referral.candidate;
  return (
    <section aria-labelledby="detalle-derivacion" className="rounded-lg border border-slate-300 bg-white p-5">
      <h2 id="detalle-derivacion" className="text-xl font-semibold">Derivación {referral.referralId}</h2>
      <p className="mt-2 text-sm text-slate-700">Oferta: {referral.openingTitle ?? referral.openingId}</p>
      <p className="text-sm text-slate-700">Fecha de derivación: {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Buenos_Aires" }).format(new Date(referral.referredAt))}</p>
      {candidate ? (
        <div className="mt-6 space-y-5">
          <div>
            <h3 className="text-lg font-semibold">Perfil laboral derivado</h3>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              <div><dt className="font-semibold">Nombre</dt><dd>{candidate.displayName}</dd></div>
              <div><dt className="font-semibold">Localidad</dt><dd>{candidate.locality ?? "No informada"}</dd></div>
              <div><dt className="font-semibold">Disponibilidad</dt><dd>{candidate.availability ?? "No informada"}</dd></div>
              <div><dt className="font-semibold">Experiencia y habilidades</dt><dd className="whitespace-pre-wrap">{candidate.skillsExperienceSummary ?? "No informadas"}</dd></div>
            </dl>
            <h4 className="mt-4 font-semibold">Categorías e intereses</h4>
            {candidate.categories.length ? <ul className="list-disc pl-6">{candidate.categories.map((category, index) => <li key={`${category.name}-${index}`}>{category.name} ({category.kind === "occupation" ? "ocupación" : "interés"})</li>)}</ul> : <p>No se informaron categorías.</p>}
          </div>
          <div>
            <h3 className="text-lg font-semibold">Contactos vigentes</h3>
            {candidate.contacts.length ? <ul className="mt-2 list-disc pl-6">{candidate.contacts.map((contact, index) => <li key={`${contact.kind}-${index}`}><span className="font-medium">{contact.kind === "email" ? "Correo" : contact.kind === "phone" ? "Teléfono" : "Otro contacto"}:</span> {contact.value}</li>)}</ul> : <p>No hay contactos vigentes para mostrar.</p>}
          </div>
          <Link href={`/api/cv/${candidate.cvDocumentId}`} className="inline-flex min-h-11 items-center rounded-md bg-blue-800 px-4 py-2 font-semibold text-white underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Descargar CV asociado a esta derivación</Link>
          <p className="text-sm text-slate-700">El acceso puede revocarse en cualquier momento. Una copia ya descargada no puede retirarse técnicamente.</p>
          <div>
            <h3 className="text-lg font-semibold">Entrevistas registradas</h3>
            {referral.interviews?.length ? <ul className="mt-2 list-disc pl-6">{referral.interviews.map((interview) => <li key={interview.id}>{interview.status}: {interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires" }) : "sin fecha programada"}{interview.companyMessage ? ` — ${interview.companyMessage}` : ""}</li>)}</ul> : <p>Aún no hay entrevistas registradas.</p>}
          </div>
          {referral.participationVersion && <InterviewForm openingId={openingId} referralId={referral.referralId} version={referral.participationVersion} />}
        </div>
      ) : (
        <p role="status" className="mt-5 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
          El acceso a los datos de esta persona finalizó. Solo se conserva esta referencia no personal para informar una respuesta pendiente.
        </p>
      )}
      <div className="mt-6">
        <FeedbackForm openingId={openingId} referralId={referral.referralId} />
      </div>
    </section>
  );
}
