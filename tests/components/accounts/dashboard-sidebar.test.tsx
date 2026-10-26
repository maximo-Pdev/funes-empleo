import { expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { UserRound } from "lucide-react";

vi.mock("@/features/accounts/actions", () => ({ logoutAction: vi.fn() }));
vi.mock("@/app/(public)/home-navbar", () => ({ HomeNavbar: () => null }));
import { DashboardShell } from "@/components/ui/dashboard-shell";
import { logoutAction } from "@/features/accounts/actions";

it.each(["Panel de usuario", "Panel de empresa", "Panel de administración"])("toggles the mobile menu without removing identity or submitting logout: %s", label => {
  render(<DashboardShell panel={{ href: "/account", label }} links={[{ href: "/account", label: "Cuenta", icon: UserRound, current: true }]} name="Cuenta ficticia" email="cuenta@example.test" canvasSlot="test-canvas"><h1>Contenido</h1></DashboardShell>);
  const sidebar = screen.getByRole("complementary", { name: label });
  const toggle = within(sidebar).getByRole("button", { name: "Contraer menú" });
  expect(toggle.getAttribute("type")).toBe("button");
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  const controlled = toggle.getAttribute("aria-controls")!.split(" ").map(id => document.getElementById(id)!);
  expect(controlled).toHaveLength(2);
  expect(controlled[0]!.contains(within(sidebar).getByRole("link", { name: "Cuenta" }))).toBe(true);
  expect(controlled[1]!.contains(within(sidebar).getByRole("button", { name: "Cerrar sesión" }))).toBe(true);
  fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(toggle.getAttribute("aria-label")).toBe("Expandir menú");
  expect(sidebar.getAttribute("data-collapsed")).toBe("true");
  expect(within(sidebar).getByRole("img", { name: "Foto de perfil de ejemplo" })).toBeTruthy();
  expect(within(sidebar).getByText("Cuenta ficticia")).toBeTruthy();
  expect(within(sidebar).getByText("cuenta@example.test")).toBeTruthy();
  expect(controlled.every(element => !element.contains(within(sidebar).getByText("Cuenta ficticia")))).toBe(true);
  expect(screen.getByRole("heading", { name: "Contenido" })).toBeTruthy();
  expect(logoutAction).not.toHaveBeenCalled();
  fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(sidebar.getAttribute("data-collapsed")).toBe("false");
  expect(within(sidebar).getByRole("link", { name: "Cuenta" }).getAttribute("aria-current")).toBe("page");
});
