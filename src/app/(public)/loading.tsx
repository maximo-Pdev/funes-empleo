import { BriefcaseBusiness, Search } from "lucide-react";
import { Skeleton } from "@/components/ui";

export default function PublicLoading() {
  return (
    <main id="contenido" className="min-h-screen bg-page text-foreground">
      <section className="border-b border-border bg-[linear-gradient(135deg,#f5f8f6_0%,#e3f2e9_52%,#f5f8f6_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div role="status" aria-live="polite">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary">
              <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
              Cargando portal de empleo…
            </div>
            <Skeleton className="h-12 w-full max-w-2xl" />
            <Skeleton className="mt-3 h-12 w-full max-w-xl" />
            <div className="mt-6 grid max-w-2xl gap-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-12 w-56 rounded-lg" />
              <Skeleton className="h-12 w-48 rounded-lg" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-elevated" aria-hidden="true">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <Skeleton className="mt-6 h-7 w-3/4" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12" aria-hidden="true">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
              <Search className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="mt-3 h-4 w-full max-w-xl" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
