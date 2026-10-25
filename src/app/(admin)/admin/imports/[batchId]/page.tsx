import { requireActiveAccount } from "@/lib/auth/guards";
import { getImportPreview } from "@/features/imports/preview-service";
import { ImportBatch } from "@/features/imports/components/preview";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ batchId: string }> }) {
  const { user } = await requireActiveAccount(["admin"]);
  return <AdminShell email={user?.email} active="/admin/imports" title="Revisión de importación ficticia" navigation={[{ href: "/admin/imports", label: "Historial" }]}><ImportBatch initial={await getImportPreview((await params).batchId)} /></AdminShell>;
}
