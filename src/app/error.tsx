"use client";

import { publicErrorFrom } from "@/lib/errors/public-error";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const safeError = publicErrorFrom(error);
  return (
    <main id="contenido" className="mx-auto flex min-h-[50vh] max-w-2xl flex-col justify-center px-6 py-12">
      <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-950">
        <h1 className="text-2xl font-bold">Ocurrió un problema</h1>
        <p className="mt-3">{safeError.message}</p>
      </div>
      <button type="button" onClick={reset} className="mt-6 min-h-11 self-start rounded-md bg-blue-800 px-5 py-2 font-semibold text-white hover:bg-blue-900">
        Volver a intentar
      </button>
    </main>
  );
}
