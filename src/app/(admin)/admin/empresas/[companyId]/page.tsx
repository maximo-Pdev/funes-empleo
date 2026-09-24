import Link from "next/link";
import { notFound } from "next/navigation";
import { RoleShell } from "@/components/layouts";
import { requireActiveAccount } from "@/lib/auth/guards";
import { databaseUuidSchema } from "@/validation/common";
import { AdminCompanyDecision } from "@/features/companies/components/admin-company-decision";

export const dynamic = "force-dynamic";
export default async function AdminCompanyPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  if (!databaseUuidSchema.safeParse(companyId).success) notFound();
  const { client } = await requireActiveAccount(["admin"]);
  const profile = await client.from("company_profiles").select("id,account_id,legal_name,status,archived_at,version")
    .eq("id", companyId).maybeSingle();
  if (profile.error || !profile.data) notFound();
  const [account, offers] = await Promise.all([
    client.from("accounts").select("id,status,version").eq("id", profile.data.account_id).single(),
    client.from("job_openings").select("id,title,status,archived_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(50),
  ]);
  if (account.error || !account.data || offers.error) notFound();
  const command = account.data.status === "suspended" ? "reactivate" : account.data.status === "archived" ? "restore" : "suspend";
  return <RoleShell role="admin" title={profile.data.legal_name || "Empresa incompleta"}
    navigation={[{ href: "/admin/empresas", label: "Empresas" }, { href: "/admin/openings", label: "Ofertas" }]}>
    <p>Cuenta: {account.data.status}. Perfil: {profile.data.status}. {profile.data.archived_at ? "Archivada." : ""}</p>
    <p className="mt-2">Una reactivación deja el perfil incompleto. Restaurar deja las ofertas archivadas en borrador; ninguna decisión recupera accesos revocados.</p>
    <AdminCompanyDecision accountId={account.data.id} version={account.data.version} command={command} />
    {account.data.status !== "archived" && <AdminCompanyDecision accountId={account.data.id} version={account.data.version} command="archive" />}
    <h2 className="mt-8 text-xl font-semibold">Ofertas de la empresa</h2>
    {offers.data?.length === 0 ? <p>No hay ofertas.</p> : <ul className="mt-3 grid gap-2">{offers.data?.map((offer) => <li key={offer.id}>
      <Link href={`/admin/openings/${offer.id}`} className="text-blue-800 underline">{offer.title || "Borrador sin título"}</Link> · {offer.status}{offer.archived_at ? " · archivada" : ""}
    </li>)}</ul>}
  </RoleShell>;
}
