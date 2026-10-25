import { requireActiveAccount } from "@/lib/auth/guards";
import { ImportUpload } from "@/features/imports/components/upload";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ retry?: string }> }) {
  const { user } = await requireActiveAccount(["admin"]);
  return <AdminShell email={user?.email} active="/admin/imports" title="Importación de demostración" navigation={[{ href: "/admin/imports", label: "Historial" }]}><ImportUpload retry={(await searchParams).retry} /></AdminShell>;
}
