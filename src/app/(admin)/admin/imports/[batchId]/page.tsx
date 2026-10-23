import { pageRecordIdentifier } from "@/lib/records/page-references";
import { recordReference } from "@/lib/records/references";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getImportPreview } from "@/features/imports/preview-service";
import { ImportBatch } from "@/features/imports/components/preview";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ batchId: string }> }) {
  await requireActiveAccount(["admin"]);
  const { batchId: reference } = await params;
  const batchId = await pageRecordIdentifier("import", reference, `/admin/imports/${reference}`);
  const preview = await getImportPreview(batchId);
  return <AdminShell active="/admin/imports" title="Revisión de importación ficticia" navigation={[{ href: "/admin/imports", label: "Historial" }]}><ImportBatch initial={preview} reference={reference} retryReference={preview.retryOf ? await recordReference("import", preview.retryOf) : undefined} /></AdminShell>;
}
