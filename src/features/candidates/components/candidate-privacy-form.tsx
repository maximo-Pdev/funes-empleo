"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { changeConsentAction } from "../consent-actions";

type Policy = { version: string; policy_text: string; policy_hash: string };
export function CandidatePrivacyForm({ version, consent, policy }: {
  version: number;
  consent: { status: string; policy_version: string; recorded_at: string } | null;
  policy: Policy;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(changeConsentAction, { message: "", success: false });
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (state.message) feedback.current?.focus(); }, [state]);
  useEffect(() => { if (state.success) router.refresh(); }, [state, router]);
  const accepted = consent?.status === "accepted";
  return <section aria-label="Privacidad" className="mt-8 grid gap-4">
    <h2 className="text-xl font-semibold">Privacidad</h2>
    <p>Este permiso operativo no sustituye los términos de uso del registro. Aceptar esos términos no habilita derivaciones ni modifica este permiso.</p>
    <p>Al aceptar, autorizás a la Oficina de Empleo a registrar y usar tus datos para acompañar tu búsqueda laboral y gestionar futuras derivaciones. Es un consentimiento general, no una aceptación por cada oferta.</p>
    <p>Si la Oficina confirma una contratación en una de tus participaciones, tu consentimiento vigente se retira automáticamente y se revocan los accesos de todas las empresas que dependan de él. No se cambian tus otras participaciones ni sus resultados y se conserva el historial.</p>
    <details>
      <summary className="cursor-pointer font-semibold">Más información</summary>
      <div className="mt-3 space-y-3">
        <p>Una empresa solo puede ver tu perfil laboral, tus contactos vigentes y el CV asociado a su derivación cuando la Oficina de Empleo te deriva a una oferta de esa empresa y el permiso sigue vigente. No puede ver tu DNI, domicilio ni notas internas, ni consultar el padrón de candidatos.</p>
        <p>Las empresas a las que la Oficina ya te haya derivado podrán seguir viendo únicamente tu nombre para identificar esas derivaciones e informar sus resultados, incluso cuando termine el permiso. Esto no les devuelve acceso a tu perfil, contactos, foto ni CV.</p>
        <p>Corregir un resultado no restablece el consentimiento. Para otorgarlo de nuevo tenés que volver a aceptarlo expresamente desde este formulario; eso no reabre participaciones ni devuelve accesos revocados.</p>
      </div>
    </details>
    <p>Permiso actual: {accepted ? "vigente" : consent?.status === "withdrawn" ? "retirado" : "pendiente"}.</p>
    <p className="text-sm">Política operativa: {policy.version}. Es una política de demostración pendiente de aprobación municipal.</p>
    <Form key={`${version}-${consent?.status ?? "pending"}`} action={action} result={state} className="grid gap-3" aria-busy={pending}>
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="status" value={accepted ? "withdrawn" : "accepted"} />
      {accepted && <p>Si retirás este permiso, las participaciones abiertas se cerrarán y los accesos empresariales quedarán revocados. El historial se conserva.</p>}
      <Field className="flex min-h-11 items-center gap-3"><input type="checkbox" name="confirmed" required />{accepted ? "Confirmo que quiero retirar el consentimiento y entiendo sus efectos." : "Confirmo esta decisión y entiendo sus efectos."}</Field>
      <p ref={feedback} tabIndex={-1} role={state.success ? "status" : "alert"} aria-live="polite">{state.message}</p>
      <Button type="submit" disabled={pending}>{accepted ? "Retirar consentimiento" : "Guardar consentimiento"}</Button>
    </Form>
  </section>;
}
