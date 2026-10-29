import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/components/ui/record-link", () => ({ RecordLabel: () => <span>Cuenta de prueba</span> }));
vi.mock("@/features/accounts/admin-invitation-actions", () => ({ administratorInvitationAction: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireActiveAccount: vi.fn() }));
vi.mock("@/app/(auth)/account/candidate-account", () => ({ renderCandidateAccount: vi.fn(() => <p>Candidate account</p>) }));
vi.mock("@/features/companies/service", () => ({ getCompanyWorkspace: vi.fn(async () => ({ profile: null })) }));
vi.mock("@/app/(admin)/_components/admin-shell", () => ({ AdminShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/app/(company)/_components/company-shell", () => ({ CompanyShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/features/accounts/actions", () => ({ logoutAction: vi.fn() }));
vi.mock("@/features/accounts/components/account-change-form", () => ({ AccountChangeForm: () => <p>Peer status control</p> }));
import { requireActiveAccount } from "@/lib/auth/guards";
import AccountPage from "@/app/(auth)/account/page";
import { administratorInvitationAction } from "@/features/accounts/admin-invitation-actions";
import { AdminInvitationForm } from "@/features/accounts/components/admin-invitation-form";

it.each(["admin", "candidate", "company"])("shows invitations only in the administrator Cuenta: %s", async role => {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(), order: vi.fn(async () => ({ data: [], error: null })) };
  vi.mocked(requireActiveAccount).mockResolvedValue({ account: { role, id: "actor" }, user: { email: "staff@example.test" }, client: { from: () => query } } as never);
  render(await AccountPage());
  expect(screen.queryByRole("form", { name: "Invitar administrador" }) !== null).toBe(role === "admin");
});

beforeEach(() => { vi.clearAllMocks(); });
it("disables resubmission while pending and after success, showing the safe result", async () => {
  let finish!: (value: { message: string; success: boolean }) => void;
  vi.mocked(administratorInvitationAction).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<AdminInvitationForm />);
  fireEvent.change(screen.getByLabelText(/Correo electrónico/), { target: { value: "staff@example.test" } });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Enviar invitación" }));
  await waitFor(() => expect(administratorInvitationAction).toHaveBeenCalledOnce());
  expect((screen.getByRole("button", { name: /Enviando/ }) as HTMLButtonElement).disabled).toBe(true);
  finish({ message: "Invitación enviada de prueba", success: true });
  await screen.findByText("Invitación enviada de prueba");
  expect((screen.getByRole("button", { name: "Enviar invitación" }) as HTMLButtonElement).disabled).toBe(true);
});

it("requires an individual email and explicit full-permission confirmation", () => {
  render(<AdminInvitationForm />);
  expect(screen.getByLabelText(/Correo electrónico/).getAttribute("type")).toBe("email");
  expect(screen.getByLabelText(/Correo electrónico/).hasAttribute("required")).toBe(true);
  const confirmation = screen.getByRole("checkbox", { name: /permisos completos/ }) as HTMLInputElement;
  expect(confirmation.required).toBe(true);
  expect(confirmation.checked).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Enviar invitación" }));
  expect(administratorInvitationAction).not.toHaveBeenCalled();
});
