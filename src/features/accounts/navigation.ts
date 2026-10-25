import "server-only";
import { readAccountSession } from "@/lib/auth/session";
import type { UserRole } from "@/domain/catalogs";

const accountAccess: Record<UserRole, { href: string; label: string }> = {
  candidate: { href: "/dashboard?section=perfil", label: "Mi perfil" },
  company: { href: "/empresa/perfil", label: "Mi perfil" },
  admin: { href: "/account", label: "Mi cuenta" },
};
const panelAccess: Record<UserRole, string> = {
  candidate: "/dashboard",
  company: "/empresa",
  admin: "/account",
};
const panelLabels: Record<UserRole, string> = {
  candidate: "Panel de usuario",
  company: "Panel de empresa",
  admin: "Panel de administración",
};
const anonymousAccess = { href: "/", label: "Iniciar sesión" };

async function readActiveRole() {
  try {
    const session = await readAccountSession();
    if (session?.account.status === "active") return session.account.role;
  } catch { return null; }
  return null;
}

export function getPanelHref(role: UserRole) {
  return panelAccess[role];
}

export async function getAccountAccess() {
  const role = await readActiveRole();
  return role ? { ...accountAccess[role] } : { ...anonymousAccess };
}

export async function getSiteAccess() {
  const role = await readActiveRole();
  if (!role) return { account: { ...anonymousAccess }, panel: null };
  return {
    account: { ...accountAccess[role] },
    panel: { href: panelAccess[role], label: panelLabels[role] },
  };
}
