import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ readSession: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.readSession }));
import { getAccountAccess, getSiteAccess } from "@/features/accounts/navigation";

beforeEach(() => vi.clearAllMocks());

it.each([
  ["candidate", "/dashboard?section=perfil", "Mi perfil"], ["company", "/empresa/perfil", "Mi perfil"], ["admin", "/account", "Cuenta"],
])("limita la proyección de %s a enlace y etiqueta sin PII", async (role, href, label) => {
  mocks.readSession.mockResolvedValue({ account: { role, status: "active", id: "private-id" }, user: { email: "private@example.invalid", user_metadata: { role: "admin" } } });
  expect(await getAccountAccess()).toEqual({ href, label });
});

it.each(["suspended", "archived", "pending_verification"])("no muestra acceso privado para cuenta %s", async status => {
  mocks.readSession.mockResolvedValue({ account: { role: "candidate", status } });
  expect(await getAccountAccess()).toEqual({ href: "/", label: "Iniciar sesión" });
});

it("no comparte resultados de identidad entre requests", async () => {
  mocks.readSession.mockResolvedValueOnce({ account: { role: "candidate", status: "active" } })
    .mockResolvedValueOnce({ account: { role: "company", status: "active" } }).mockResolvedValueOnce(null);
  expect((await getAccountAccess()).href).toBe("/dashboard?section=perfil");
  expect((await getAccountAccess()).href).toBe("/empresa/perfil");
  expect((await getAccountAccess()).href).toBe("/");
  expect(mocks.readSession).toHaveBeenCalledTimes(3);
});

it("devuelve acceso público seguro cuando no se puede verificar la identidad", async () => {
  mocks.readSession.mockRejectedValue(new Error("PRIVATE-internal-error"));
  expect(await getAccountAccess()).toEqual({ href: "/", label: "Iniciar sesión" });
});

it.each([
  ["candidate", "/dashboard?section=perfil", "/dashboard", "Panel de usuario"],
  ["company", "/empresa/perfil", "/empresa", "Panel de empresa"],
  ["admin", "/account", "/account", "Panel de administración"],
] as const)("expone el panel de %s solo con sesión activa", async (role, accountHref, panelHref, panelLabel) => {
  mocks.readSession.mockResolvedValue({ account: { role, status: "active", id: "private-id" } });
  expect(await getSiteAccess()).toEqual({
    account: { href: accountHref, label: role === "admin" ? "Cuenta" : "Mi perfil" },
    panel: { href: panelHref, label: panelLabel },
  });
});

it.each(["suspended", "archived", "pending_verification"])("omite el panel para la cuenta %s", async status => {
  mocks.readSession.mockResolvedValue({ account: { role: "candidate", status } });
  expect(await getSiteAccess()).toEqual({ account: { href: "/", label: "Iniciar sesión" }, panel: null });
});
