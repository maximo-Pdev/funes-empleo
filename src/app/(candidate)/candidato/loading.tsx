import { Card, Skeleton } from "@/components/ui";
import { CandidateShell } from "./_components/candidate-shell";

export default function CandidateLoading() {
  return <CandidateShell title="Tu espacio de empleo">
    <p role="status" aria-live="polite" className="mb-5 text-sm text-primary-700">Cargando tus datos…</p>
    <div aria-hidden="true" className="grid gap-5 md:grid-cols-2">{[0, 1, 2, 3].map(item => <Card key={item} className="space-y-5 p-6"><Skeleton className="h-10 w-10 rounded-lg" /><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-12 w-full rounded-lg" /></Card>)}</div>
  </CandidateShell>;
}
