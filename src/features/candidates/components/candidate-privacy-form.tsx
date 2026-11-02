"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { changeConsentAction } from "../consent-actions";
import styles from "./candidate-privacy-form.module.css";

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
  return <section aria-label="Privacidad" className={styles.section}>
    <Card className={styles.card}>
    <div className={styles.header}>
      <div className={styles.title}>
        <span className={styles.icon} aria-hidden="true"><Shield /></span>
        <h2>Privacidad</h2>
      </div>
      <Badge variant="status" tone={accepted ? "green" : consent?.status === "withdrawn" ? "red" : "amber"}>
        {`Permiso actual: ${accepted ? "vigente" : consent?.status === "withdrawn" ? "retirado" : "pendiente"}.`}
      </Badge>
    </div>
    <div className={styles.layout}>
    <div className={styles.information}>
    <div className={styles.context}>
    <p>Este permiso operativo no sustituye los términos de uso del registro. Aceptar esos términos no habilita derivaciones ni modifica este permiso.</p>
    </div>
    <p>Al aceptar, autorizás a la Oficina de Empleo a registrar y usar tus datos para acompañar tu búsqueda laboral y gestionar futuras derivaciones. Es un consentimiento general, no una aceptación por cada oferta.</p>
    <p>Si la Oficina confirma una contratación, tu disponibilidad cambia a «No disponible» y no se realizan nuevas derivaciones mientras sigas en ese estado. Tu consentimiento se conserva: no tenés que aceptarlo de nuevo por cada oferta ni por una contratación. Tus otras participaciones y su historial no cambian.</p>
    <details className={styles.details}>
      <summary>Más información</summary>
      <div className={styles.moreText}>
        <p>Una empresa solo puede ver tu perfil laboral, tus contactos vigentes y el CV asociado a su derivación cuando la Oficina de Empleo te deriva a una oferta de esa empresa y el permiso sigue vigente. No puede ver tu DNI, domicilio ni notas internas, ni consultar el padrón de candidatos.</p>
        <p>Las empresas a las que la Oficina ya te haya derivado podrán seguir viendo únicamente tu nombre para identificar esas derivaciones e informar sus resultados, incluso cuando termine el permiso. Esto no les devuelve acceso a tu perfil, contactos, foto ni CV.</p>
        <p>La empresa que te contrata conserva el acceso autorizado durante 30 días desde que la Oficina confirma la contratación, siempre que el permiso siga vigente. Los permisos de otras derivaciones mantienen sus condiciones. Una contratación tardía o una corrección no devuelve accesos revocados.</p>
        <p>Si retiraste el consentimiento, para otorgarlo de nuevo tenés que aceptarlo expresamente desde este formulario. Esa aceptación no reabre participaciones ni devuelve accesos revocados.</p>
      </div>
    </details>
    </div>
    <div className={styles.decision}>
    <h3>Gestionar consentimiento</h3>
    {accepted && <p className={styles.stateDescription}>Ya aceptaste el consentimiento. No necesitás volver a aceptarlo mientras siga vigente.</p>}
    <Form key={`${version}-${consent?.status ?? "pending"}`} action={action} result={state} className={styles.form} aria-busy={pending}>
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="status" value={accepted ? "withdrawn" : "accepted"} />
      {accepted && <p>Si retirás este permiso, las participaciones abiertas se cerrarán y los accesos empresariales quedarán revocados. El historial se conserva.</p>}
      <Field className={styles.confirmation}><input type="checkbox" name="confirmed" required />{accepted ? "Confirmo que quiero retirar el consentimiento y entiendo sus efectos." : "Confirmo esta decisión y entiendo sus efectos."}</Field>
      <p className={styles.feedback} ref={feedback} tabIndex={-1} role={state.success ? "status" : "alert"} aria-live="polite">{state.message}</p>
      <Button type="submit" variant={accepted ? "destructive" : "primary"} disabled={pending}>{accepted ? "Retirar consentimiento" : "Guardar consentimiento"}</Button>
    </Form>
    </div>
    </div>
    <p className={styles.policy}>Política operativa: {policy.version}. Es una política de demostración pendiente de aprobación municipal.</p>
    </Card>
  </section>;
}
