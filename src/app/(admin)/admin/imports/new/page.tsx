import { requireActiveAccount } from "@/lib/auth/guards";
import { ImportUpload } from "@/features/imports/components/upload";
import { RoleShell } from "@/components/layouts";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ retry?: string }> }) {
  await requireActiveAccount(["admin"]);
  return <RoleShell role="admin" title="Importación de demostración" navigation={[{ href: "/admin/imports", label: "Historial" }]}><ImportUpload retry={(await searchParams).retry} /></RoleShell>;
}
