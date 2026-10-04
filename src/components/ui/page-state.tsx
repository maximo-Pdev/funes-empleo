import { BriefcaseBusiness } from "lucide-react";
import { Skeleton } from "./skeleton";

export function LoadingState({ message = "Cargando información…" }: { message?: string }) {
  return (
    <section role="status" aria-live="polite" className="rounded-xl border border-border bg-card p-6 text-foreground shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary" aria-hidden="true">
          <BriefcaseBusiness className="h-5 w-5" />
        </span>
        <p className="font-medium">{message}</p>
      </div>
      <div className="mt-5 grid gap-3" aria-hidden="true">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </section>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 text-foreground shadow-card">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary" aria-hidden="true">
          <BriefcaseBusiness className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-2 leading-7 text-muted-foreground">{description}</p>
        </div>
      </div>
    </section>
  );
}
