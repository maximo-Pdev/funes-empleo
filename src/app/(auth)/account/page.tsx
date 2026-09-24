import Link from "next/link";
import { requireActiveAccount } from "@/lib/auth/guards";
import { logoutAction } from "@/features/accounts/actions";
import { AccountChangeForm } from "@/features/accounts/components/account-change-form";
export const dynamic = "force-dynamic";
export default async function AccountPage() {
  const { account, client } = await requireActiveAccount();
  const peers = account.role === "admin" ? await client.from("accounts").select("id,role,status,version").eq("role", "admin").neq("id", account.id).order("created_at") : null;
  return <main id="contenido" className="mx-auto max-w-3xl px-6 py-12">
    <h1 className="text-3xl font-bold">Mi cuenta</h1>
    <p className="mt-4">Acceso individual activo. Rol: {account.role === "admin" ? "Administración" : account.role === "candidate" ? "Candidato" : "Empresa"}.</p>
    {account.role === "candidate" ? <p className="mt-3"><Link className="text-blue-800 underline" href="/candidato/perfil">Completar mi perfil</Link> · <Link className="text-blue-800 underline" href="/candidato/ofertas">Ver ofertas</Link> · <Link className="text-blue-800 underline" href="/candidato/postulaciones">Mis participaciones</Link></p> :
      <p className="mt-3">Los flujos de empresa se incorporarán en su etapa correspondiente.</p>}
    <Link href="/update-password" className="mt-4 block text-blue-800 underline">Cambiar contraseña</Link>
    <form action={logoutAction}><button className="my-4 rounded bg-blue-800 p-3 text-white">Cerrar sesión</button></form>
    {account.role !== "admin" && <section aria-label="Archivo recuperable"><h2 className="text-xl font-bold text-red-900">Archivar mi cuenta</h2><p>Se bloqueará el acceso. La Oficina conservará el historial y solo administración podrá restaurarla.</p><AccountChangeForm id={account.id} version={account.version} command="archive" /></section>}
    {account.role === "admin" && <section aria-label="Cuentas administrativas"><h2 className="text-xl font-bold">Administradores individuales</h2>
      {peers?.error && <p role="alert">No se pudo cargar la lista. Recargá la página.</p>}
      {peers?.data?.map((peer) => <article key={peer.id} className="mt-6"><h3 className="break-all font-semibold">Cuenta {peer.id}</h3><p>Estado: {peer.status}</p>{(peer.status === "active" || peer.status === "suspended") && <AccountChangeForm id={peer.id} version={peer.version} command={peer.status === "active" ? "suspend" : "reactivate"} />}</article>)}
    </section>}
  </main>;
}
