import { Skeleton } from "@/components/ui";
import { AdminShell } from "./admin-shell";

export function AdminLoading({ title, active }: { title: string; active: string }) {
  return <AdminShell title={title} active={active}>
    <div role="status" aria-live="polite">
      <p className="sr-only">{title}…</p>
      <div aria-hidden="true" className="space-y-6">
        <div className="grid gap-4 rounded-xl border border-border bg-surface p-6 sm:grid-cols-2"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
        <div className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map(item => <div key={item} className="space-y-4 rounded-xl border border-border bg-surface p-6"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>)}</div>
      </div>
    </div>
  </AdminShell>;
}
