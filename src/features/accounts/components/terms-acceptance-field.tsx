"use client";
import Link from "next/link";
import { Field } from "@/components/forms/field";
import { REGISTRATION_TERMS_VERSION, registrationTermsLabel } from "../legal-terms";

export function TermsAcceptanceField() {
  return <div className="grid gap-2 text-sm">
    <p><Link href="/terminos" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Términos de uso y aviso de privacidad</Link> (se abre en otra pestaña).</p>
    <input type="hidden" name="termsVersion" value={REGISTRATION_TERMS_VERSION} />
    <Field className="flex min-h-11 items-start gap-3 py-2">
      <input type="checkbox" name="termsAccepted" required className="mt-1 h-5 w-5 shrink-0" />
      {registrationTermsLabel}
    </Field>
  </div>;
}
