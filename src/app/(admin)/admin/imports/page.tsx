import Link from "next/link";
import { requireActiveAccount } from "@/lib/auth/guards";
import { listImports } from "@/features/imports/preview-service";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
export const dynamic = "force-dynamic";
export default async function Page() {
  const { user } = await requireActiveAccount(["admin"]);
  const batches = await listImports();
  const states: Record<string, string> = { uploaded: "Cargado", preview_ready: "Listo para confirmar", blocked: "Bloqueado", confirming: "Confirmando", completed: "Completado", failed: "Fallido" };
  return <AdminShell email={user?.email} active="/admin/imports" title="Historial de importaciones" navigation={[{ href: "/admin/candidates", label: "Candidatos" }]}>
    <p>Solo demostración ficticia. Se muestran los últimos 50 lotes; cada intento conserva su enlace.</p>
    <Link className="mt-5 inline-flex rounded bg-blue-800 px-5 py-3 text-white" href="/admin/imports/new">Nueva importación ficticia</Link>
    {!batches.length && <p>No hay importaciones registradas.</p>}
    <ul className="mt-4 grid gap-3">{batches.map(b => <li key={b.id}><Link className="block rounded border bg-white p-5 text-blue-800 underline" href={`/admin/imports/${b.id}`}>{new Date(b.created_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })} · {states[b.status] ?? "Archivado"} · {b.total_rows} filas</Link></li>)}</ul>
  </AdminShell>;
}
