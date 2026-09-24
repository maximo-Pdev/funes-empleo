"use client";
import { useEffect, useRef } from "react";

export default function CandidateError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <main id="contenido" className="mx-auto max-w-3xl px-4 py-10">
    <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold">No pudimos cargar esta pantalla</h1>
    <p className="mt-3">Intentá de nuevo. Si el problema continúa, contactá a la Oficina de Empleo.</p>
    <button type="button" onClick={reset} className="mt-5 rounded bg-blue-800 p-3 text-white">Reintentar</button>
  </main>;
}
