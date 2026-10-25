import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getAssistedWorkspace } from "@/features/candidates/assisted-service";
import { AssistedProfileForm } from "@/features/candidates/components/assisted/assisted-forms";
export const dynamic = "force-dynamic";
export default async function AssistedPage() {
  const { user } = await requireActiveAccount(["admin"]);
  const { categories } = await getAssistedWorkspace();
  return <AdminShell email={user?.email} active="/admin/candidates" title="Atención presencial" description="Alta y mantenimiento con responsabilidad municipal."
    navigation={[{ href: "/admin/candidates", label: "Volver a candidatos" }]}>
    <AssistedProfileForm categories={categories} />
  </AdminShell>;
}
