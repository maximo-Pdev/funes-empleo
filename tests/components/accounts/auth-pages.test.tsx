import { beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), neq: vi.fn(), order: vi.fn(), logout: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireActiveAccount: mocks.guard }));
vi.mock("@/features/accounts/actions", () => ({ loginAction: vi.fn(), passwordAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn(), logoutAction: mocks.logout, accountStatusAction: vi.fn() }));
import Recovery from "@/app/(auth)/recover/page";
import Pending from "@/app/(auth)/verification-pending/page";
import Expired from "@/app/(auth)/verification-expired/page";
import Invalid from "@/app/(auth)/recovery-invalid/page";
import Session from "@/app/(auth)/session-expired/page";
import Suspended from "@/app/(auth)/account-suspended/page";
import Logout from "@/app/(auth)/logout/page";
import Password from "@/app/(auth)/update-password/page";
import Account from "@/app/(auth)/account/page";

function session(role = "candidate") {
 mocks.order.mockResolvedValue({ data: [{ id: "admin-ficticio-2", status: "active", version: 2 }, { id: "admin-ficticio-3", status: "suspended", version: 3 }], error: null });
 mocks.neq.mockReturnValue({ order: mocks.order });
 return { account: { id: "cuenta-ficticia", role, version: 1 }, client: { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ neq: mocks.neq })) })) })) } };
}
beforeEach(() => { vi.clearAllMocks(); mocks.guard.mockResolvedValue(session()); });
it.each([
 [Recovery, "Solicitar enlace de recuperación"], [Pending, "Reenviar verificación"],
 [Expired, "Reenviar verificación"], [Invalid, "Solicitar enlace de recuperación"],
])("conserva el formulario de correo de %s", (Page, button) => {
 render(<Page />);
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
it.each(["candidate", "company"])("conserva archivo confirmado para %s", async role => {
 mocks.guard.mockResolvedValue(session(role)); render(await Account());
 expect(screen.getByRole("checkbox")).toHaveProperty("required", true);
 expect(screen.getByRole("button", { name: "Archivar mi cuenta" })).toBeTruthy();
 expect(screen.queryByRole("region", { name: "Cuentas administrativas" })).toBeNull();
 expect(document.querySelector('[name="command"]')).toHaveProperty("value", "archive");
});
it("no ofrece archivo a administración y mantiene la exclusión del propio administrador", async () => {
 mocks.guard.mockResolvedValue(session("admin")); render(await Account());
 expect(mocks.neq).toHaveBeenCalledWith("id", "cuenta-ficticia");
 expect(screen.queryByRole("button", { name: "Archivar mi cuenta" })).toBeNull();
 expect(screen.getByRole("button", { name: "Suspender cuenta" })).toBeTruthy();
 expect(screen.getByRole("button", { name: "Reactivar cuenta" })).toBeTruthy();
 expect(screen.getAllByRole("checkbox").every(item => (item as HTMLInputElement).required)).toBe(true);
});
it("conserva los mensajes seguros de sesión y suspensión", () => {
 const view = render(<Session />);
 expect(screen.getByText(/No hay una sesión habilitada/)).toBeTruthy();
 view.unmount(); render(<Suspended />);
 expect(screen.getByText(/no muestra motivos internos/)).toBeTruthy();
});
it("mantiene la confirmación explícita de cierre de sesión", () => {
 render(<Logout />);
 expect(screen.getByRole("button", { name: "Confirmar cierre de sesión" })).toBeTruthy();
 expect(mocks.logout).not.toHaveBeenCalled();
});
