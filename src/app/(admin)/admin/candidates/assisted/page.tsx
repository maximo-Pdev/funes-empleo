import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { requireActiveAccount } from "@/lib/auth/guards";
import { getAssistedWorkspace, getAssistedCreationPolicy } from "@/features/candidates/assisted-service";
import { AssistedProfileForm } from "@/features/candidates/components/assisted/assisted-forms";
export const dynamic = "force-dynamic";
export default async function AssistedPage() {
  const { user } = await requireActiveAccount(["admin"]);
  const [{ categories }, creationPolicy] = await Promise.all([getAssistedWorkspace(), getAssistedCreationPolicy()]);
  return <AdminShell email={user?.email} active="/admin/atencion-presencial" title="Atención presencial" description="Alta y mantenimiento con responsabilidad municipal."
    navigation={[{ href: "/admin/atencion-presencial", label: "Volver a atención presencial" }]}>
    <AssistedProfileForm categories={categories} creationPolicy={creationPolicy} />
  </AdminShell>;
}
