import { RecordLabel } from "@/components/ui/record-link";
import { Form } from "@/components/forms/form";
import Link from "next/link";
import { accountStatusLabels, displayLabel } from "@/domain/presentation/labels";
import { accountStatusTones, statusTone } from "@/domain/presentation/status-tone";
import { ArrowRight, KeyRound, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";
import { AuthShell } from "../_components/auth-surface";
import styles from "../_components/auth-forms.module.css";
import { requireActiveAccount } from "@/lib/auth/guards";
import { logoutAction } from "@/features/accounts/actions";
import { AccountChangeForm } from "@/features/accounts/components/account-change-form";
import { renderCandidateAccount, type AccountSearchParams } from "./candidate-account";
import { CompanyShell } from "@/app/(company)/_components/company-shell";

export const dynamic = "force-dynamic";
export default async function AccountPage({ searchParams = Promise.resolve({}) }: { searchParams?: Promise<AccountSearchParams> } = {}) {
  const { account, client, user } = await requireActiveAccount();
  if (account.role === "candidate") {
    return renderCandidateAccount({ params: await searchParams, email: user?.email });
  }
  if (account.role === "company") {
    const { getCompanyWorkspace } = await import("@/features/companies/service");
    const workspace = await getCompanyWorkspace();
    return <CompanyShell title="Cuenta" active="/account" name={workspace.profile?.legalName} email={user.email}>
      <p className="text-sm leading-6 text-muted-foreground">Acceso individual activo. Rol: Empresa.</p>
      <Card className="mt-7 p-6 sm:p-8"><KeyRound className="h-6 w-6 text-primary" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold text-primary-900">Contraseña</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Actualizá tu contraseña desde tu cuenta. No la compartas con otras personas.</p><Link href="/update-password" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-900">Cambiar contraseña<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Card>
    </CompanyShell>;
  }
  const peers = account.role === "admin" ? await client.from("accounts").select("id,role,status,version").eq("role", "admin").neq("id", account.id).order("created_at") : null;
  const content = <>
    {account.role !== "admin" && <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary" aria-hidden="true"><UserRound className="h-6 w-6" /></span><div><p className="text-sm font-semibold text-primary-700">Tu acceso al portal</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">Mi cuenta</h1></div></div>}
    <p className="mt-4 inline-flex items-start gap-2 text-sm leading-6 text-muted-foreground"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Acceso individual activo. Rol: {account.role === "admin" ? "Administración" : "Empresa"}.</p>
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <Card className="p-6 sm:p-8"><KeyRound className="h-6 w-6 text-primary" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold text-primary-900">Contraseña</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Actualizá tu contraseña desde tu cuenta. No la compartas con otras personas.</p><Link href="/update-password" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-900">Cambiar contraseña<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Card>
      {account.role !== "admin" && <Card className="p-6 sm:p-8"><LogOut className="h-6 w-6 text-primary" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold text-primary-900">Cerrar sesión</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Cerrá tu sesión cuando termines de usar el portal.</p><div className={`${styles.forms} mt-5`}><Form action={logoutAction}><button className="text-white">Cerrar sesión</button></Form></div></Card>}
    </div>
    {account.role === "admin" && <section aria-label="Cuentas administrativas" className="mt-7"><h2 className="text-xl font-bold text-primary-900">Administradores individuales</h2>
      {peers?.error && <p role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 p-5 leading-7 text-red-900">No se pudo cargar la lista. Recargá la página.</p>}
      <div className="mt-5 grid gap-5 md:grid-cols-2">{peers?.data?.map(peer => <Card key={peer.id} className="min-w-0 p-6"><h3 className="break-all text-base font-semibold text-primary-900">Cuenta <RecordLabel kind="account" id={peer.id} /></h3><p className="mt-3 flex flex-wrap items-center gap-2 text-sm leading-6">Estado <Badge variant="status" tone={statusTone(accountStatusTones, peer.status)}>{displayLabel(accountStatusLabels, peer.status)}</Badge></p>{(peer.status === "active" || peer.status === "suspended") && <div className={`${styles.forms} ${styles.danger} mt-5`}><AccountChangeForm id={peer.id} version={peer.version} command={peer.status === "active" ? "suspend" : "reactivate"} /></div>}</Card>)}</div>
    </section>}
  </>;
  return account.role === "admin"
    ? <AdminShell title="Cuenta" active="/account" email={user?.email}>{content}</AdminShell>
    : <AuthShell>{content}</AuthShell>;
}
