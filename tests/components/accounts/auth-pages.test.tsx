import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import accountStyles from "@/app/(auth)/account/account.module.css";
import homeStyles from "@/app/(public)/home.module.css";
import formStyles from "@/components/forms/form.module.css";
import adminStyles from "@/app/(admin)/_components/admin-workspace.module.css";
import authStyles from "@/app/(auth)/_components/auth-forms.module.css";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), neq: vi.fn(), order: vi.fn(), logout: vi.fn(), candidate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn(async () => null) }));
vi.mock("@/app/(auth)/account/candidate-account", () => ({ renderCandidateAccount: mocks.candidate }));
vi.mock("@/lib/auth/guards", () => ({ requireActiveAccount: mocks.guard }));
vi.mock("@/features/companies/service", () => ({ getCompanyWorkspace: vi.fn().mockResolvedValue({ profile: { legalName: "Empresa Ficticia" } }) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/account", useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/features/accounts/actions", () => ({ loginAction: vi.fn(), passwordAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn(), logoutAction: mocks.logout, accountStatusAction: vi.fn() }));
vi.mock("@/features/accounts/admin-invitation-actions", () => ({ administratorInvitationAction: vi.fn() }));
import Recovery from "@/app/(auth)/recover/page";
import Expired from "@/app/(auth)/verification-expired/page";
import Logout from "@/app/(auth)/logout/page";
import Password from "@/app/(auth)/update-password/page";
import Account from "@/app/(auth)/account/page";

function session(role = "candidate") {
 mocks.order.mockResolvedValue({ data: [{ id: "admin-ficticio-2", status: "active", version: 2 }, { id: "admin-ficticio-3", status: "suspended", version: 3 }], error: null });
 mocks.neq.mockReturnValue({ order: vi.fn().mockReturnThis(), range: mocks.order });
 return { user: role === "candidate" ? undefined : { email: role === "admin" ? "admin@example.invalid" : "empresa@example.invalid" }, account: { id: "cuenta-ficticia", role, version: 1 }, client: { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ neq: mocks.neq })) })) })) } };
}
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue(session()); });
it("guards the candidate dashboard before forwarding its selected section", async () => {
 await Account({ searchParams: Promise.resolve({ section: "ofertas" }) });
 expect(mocks.guard).toHaveBeenCalledOnce();
 expect(mocks.candidate).toHaveBeenCalledWith({ params: { section: "ofertas" }, email: undefined });
});

vi.mock("@/components/ui/record-link", async () => (await import("../../fixtures/record-references")).recordLinkMocks);
it.each([
 [Recovery, "Solicitar enlace de recuperación"],
 [Expired, "Reenviar verificación"],
])("conserva el formulario de correo de %s", async (Page, button) => {
 render(await Page());
 expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
 expect(screen.getByLabelText("Correo electrónico")).toHaveProperty("required", true);
 expect(screen.getByLabelText("Correo electrónico")).toHaveProperty("type", "email");
 expect(screen.getByRole("button", { name: button as string })).toBeTruthy();
 expect(screen.queryByLabelText("Contraseña")).toBeNull();
});
it("conserva la guardia y los campos de contraseña nueva y confirmación", async () => {
 render(await Password());
 expect(mocks.guard).toHaveBeenCalledOnce();
 expect(screen.getByLabelText("Nueva contraseña")).toHaveProperty("minLength", 6);
 expect(screen.getByLabelText("Nueva contraseña")).toHaveProperty("autocomplete", "new-password");
 expect(screen.getByLabelText("Repetir nueva contraseña")).toHaveProperty("required", true);
});
it.each(["company"])("no ofrece autoarchivo a %s y conserva contraseña/logout", async role => {
 mocks.guard.mockResolvedValue(session(role)); render(await Account());
 expect(screen.queryByRole("navigation", { name: "Navegación de Oficina de Empleo" })).toBeNull();
 expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
 expect(screen.queryByRole("checkbox")).toBeNull();
 expect(screen.queryByRole("button", { name: /archivar|eliminar/i })).toBeNull();
 expect(screen.getByRole("link", { name: /Cambiar contraseña/ })).toBeTruthy();
 expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeTruthy();
 expect(screen.queryByRole("region", { name: "Cuentas administrativas" })).toBeNull();
 expect(document.querySelector('[name="command"]')).toBeNull();
});
it("no ofrece archivo a administración y mantiene la exclusión del propio administrador", async () => {
 mocks.guard.mockResolvedValue(session("admin")); const view = render(await Account());
 saveAdminFixture("account", view.container.innerHTML);
 const sidebar = screen.getByRole("complementary", { name: "Panel de administración" });
 expect(within(sidebar).getByTitle("admin@example.invalid")).toBeTruthy();
 expect(screen.getAllByRole("button", { name: "Cerrar sesión" })).toHaveLength(1);
 expect(within(screen.getByRole("main")).queryByRole("button", { name: "Cerrar sesión" })).toBeNull();
 expect(screen.getByRole("main").querySelector('[data-slot="admin-canvas"]')).toBeTruthy();
 const navigation = within(sidebar).getByRole("navigation", { name: "Navegación de Oficina de Empleo" });
 expect(within(navigation).getByRole("link", { name: "Cuenta" }).getAttribute("aria-current")).toBe("page");
 expect(within(navigation).getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/admin", "/admin/candidates", "/admin/atencion-presencial", "/admin/empresas", "/admin/openings", "/admin/participations", "/admin/courses", "/admin/metrics", "/admin/notificaciones", "/account"]);
 expect(within(navigation).getByRole("link", { name: "Perfil asistido" }).getAttribute("href")).toBe("/admin/atencion-presencial");
 expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
 expect(mocks.neq).toHaveBeenCalledWith("id", "cuenta-ficticia");
 expect(screen.queryByRole("button", { name: "Archivar mi cuenta" })).toBeNull();
 expect(screen.getByRole("button", { name: "Suspender cuenta" })).toBeTruthy();
 expect(screen.getByRole("button", { name: "Reactivar cuenta" })).toBeTruthy();
 expect(screen.getAllByRole("checkbox").every(item => (item as HTMLInputElement).required)).toBe(true);
});
it("preserves administrative account errors inside the shared canvas", async () => {
 mocks.guard.mockResolvedValue(session("admin"));
 mocks.order.mockResolvedValue({ data: null, error: { message: "Fictitious unavailable service" } });
 const view = render(await Account());
 expect(screen.getByRole("main").querySelector('[data-slot="admin-canvas"] [role="alert"]')).toBeTruthy();
 expect(screen.getByRole("alert").textContent).toBe("No se pudo cargar la lista. Recargá la página.");
 expect(screen.getByRole("button", { name: "Cerrar sesión" }).closest("aside")).toBeTruthy();
 saveAdminFixture("account-error", view.container.innerHTML);
});

function saveAdminFixture(section: string, html: string) {
 const output = process.env.ADMIN_WORKSPACE_FIXTURE_DIR;
 if (!output) return;
 const modules = [
  ["src/app/(auth)/account/account.module.css", accountStyles],
  ["src/app/(public)/home.module.css", homeStyles],
  ["src/components/forms/form.module.css", formStyles],
  ["src/app/(admin)/_components/admin-workspace.module.css", adminStyles],
  ["src/app/(auth)/_components/auth-forms.module.css", authStyles],
 ] as const;
 const css = modules.map(([file, names]) => readFileSync(file, "utf8").replace(/\.([a-zA-Z_][\w-]*)/g, (selector, name: string) => names[name] ? `.${names[name]}` : selector)).join("\n");
 mkdirSync(output, { recursive: true });
 writeFileSync(path.join(output, `${section}.json`), JSON.stringify({ section, html, css }));
}
it("mantiene la confirmación explícita de cierre de sesión", async () => {
 render(await Logout());
 expect(screen.getByRole("button", { name: "Confirmar cierre de sesión" })).toBeTruthy();
 expect(mocks.logout).not.toHaveBeenCalled();
});
