"use client";
import { useEffect, useRef } from "react";
import { CircleAlert, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui";
import { CandidateShell } from "./_components/candidate-shell";

export default function CandidateError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <CandidateShell title="Tu espacio de empleo">
    <Card className="mx-auto max-w-2xl p-6 sm:p-10">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary"><CircleAlert className="h-6 w-6" aria-hidden="true" /></span>
      <h2 ref={heading} tabIndex={-1} className="mt-5 text-2xl font-bold text-primary-900">No pudimos cargar esta pantalla</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">Intentá de nuevo. Si el problema continúa, contactá a la Oficina de Empleo.</p>
      <button type="button" onClick={reset} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700"><RotateCcw className="h-4 w-4" aria-hidden="true" />Reintentar</button>
    </Card>
  </CandidateShell>;
}
