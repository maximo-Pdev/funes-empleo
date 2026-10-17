import "server-only";
import { readAccountSession } from "@/lib/auth/session";
import type { UserRole } from "@/domain/catalogs";

const accountAccess: Record<UserRole, { href: string; label: string }> = {
  candidate: { href: "/candidato/perfil", label: "Mi perfil" },
  company: { href: "/empresa/perfil", label: "Mi perfil" },
  admin: { href: "/account", label: "Mi cuenta" },
};
const anonymousAccess = { href: "/login", label: "Iniciar sesión" };

export async function getAccountAccess() {
  try {
    const session = await readAccountSession();
    if (session?.account.status === "active") return { ...accountAccess[session.account.role] };
  } catch { return { ...anonymousAccess }; }
  return { ...anonymousAccess };
}
