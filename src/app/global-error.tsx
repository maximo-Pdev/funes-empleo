"use client";

import { publicErrorFrom } from "@/lib/errors/public-error";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const safeError = publicErrorFrom(error);
  return (
    <html lang="es-AR">
      <body style={{ margin: 0, background: "#f8fafc", color: "#172033", fontFamily: "Arial, sans-serif" }}>
        <main id="contenido" style={{ maxWidth: 640, margin: "12vh auto", padding: 24 }}>
          <div role="alert">
            <h1>Ocurrió un problema</h1>
            <p>{safeError.message}</p>
          </div>
          <button type="button" onClick={reset} style={{ minHeight: 44, padding: "10px 18px", background: "#1e40af", color: "white", border: 0, borderRadius: 6, cursor: "pointer" }}>
            Volver a intentar
          </button>
        </main>
      </body>
    </html>
  );
}
