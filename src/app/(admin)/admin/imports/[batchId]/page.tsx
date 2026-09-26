import { requireActiveAccount } from "@/lib/auth/guards";
import { getImportPreview } from "@/features/imports/preview-service";
import { ImportBatch } from "@/features/imports/components/preview";
import { RoleShell } from "@/components/layouts";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ batchId: string }> }) {
  await requireActiveAccount(["admin"]);
  return <RoleShell role="admin" title="Revisión de importación ficticia" navigation={[{ href: "/admin/imports", label: "Historial" }]}><ImportBatch initial={await getImportPreview((await params).batchId)} /></RoleShell>;
}
