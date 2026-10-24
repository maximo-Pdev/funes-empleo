"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Form } from "@/components/forms/form";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui";
import { cancelCompanyOpeningAction } from "../../company-actions";

export function CompanyOpeningCancel({ openingId, version }: { openingId: string; version: number }) {
  const router = useRouter();
  const [result, action, pending] = useActionState(cancelCompanyOpeningAction, { message: "", success: false });
  const message = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (result.message) message.current?.focus(); if (result.success) router.refresh(); }, [result, router]);
  return <Form action={action} result={result} aria-busy={pending} aria-label="Cancelación de oferta" className="danger grid gap-3 rounded-lg border border-red-500 bg-surface p-5">
    <h2 className="text-xl font-semibold">Eliminar oferta</h2>
    <p>La oferta quedará Cancelada y seguirá en tu listado. Se cerrarán sus casos abiertos y se revocarán los accesos asociados. Los resultados finales y el historial se conservan.</p>
    <input type="hidden" name="id" value={openingId} /><input type="hidden" name="version" value={version} />
    <Field className="grid gap-1">Motivo de la cancelación<textarea name="cancelReason" required maxLength={1000} rows={3} /></Field>
    <Field className="flex gap-2"><input type="checkbox" name="cancelConfirmed" required />Confirmo que quiero cancelar esta oferta y cerrar sus casos abiertos.</Field>
    <p ref={message} tabIndex={-1} role={result.success ? "status" : "alert"}>{result.message}</p>
    <Button type="submit" variant="danger" busy={pending}>Eliminar oferta</Button>
  </Form>;
}
