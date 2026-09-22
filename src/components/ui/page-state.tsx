export function LoadingState({ message = "Cargando información…" }: { message?: string }) {
  return (
    <div role="status" aria-live="polite" className="rounded-md border border-slate-300 bg-white p-5 text-slate-800">
      {message}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-md border border-slate-300 bg-white p-6 text-slate-800">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2">{description}</p>
    </section>
  );
}
