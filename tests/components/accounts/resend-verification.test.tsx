import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verificationAction: vi.fn(),
  registerCandidateAction: vi.fn(),
  registerCompanyAction: vi.fn(),
}));
vi.mock("@/features/accounts/actions", () => ({ loginAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: mocks.verificationAction, passwordAction: vi.fn() }));
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: mocks.registerCandidateAction }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: mocks.registerCompanyAction }));

import { HomeAccessPanel } from "@/app/(public)/home-access-panel";
import { RESEND_COOLDOWN_SECONDS, ResendVerification } from "@/features/accounts/components/resend-verification";

const renewalMessage = "Si corresponde, recibirás un enlace en tu correo. Revisá también la carpeta de correo no deseado.";
const candidateMessage = "Si los datos son válidos, recibirás un enlace para verificar tu correo. Revisá también spam.";
const companyMessage = "Si los datos son válidos, recibirás un enlace para verificar el correo. Revisá también spam.";
const prompt = "¿No recibiste el correo de confirmación?";
const confirmationTitle = "Revisá tu correo electrónico";

/** The countdown reschedules itself, so each tick needs a commit before the next timer runs. */
async function advance(seconds: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(seconds * 1000); });
}

function submitForm() {
  return act(async () => {
    fireEvent.click(document.querySelector<HTMLButtonElement>('form button[type="submit"]')!);
  });
}

/** The mode tabs and the registration submit share the "Registrarse" name; scope to the switch. */
function modeTab(name: string) {
  return within(screen.getByRole("group", { name: "Opciones de acceso" })).getByRole("button", { name });
}

async function registerCandidate() {
  fireEvent.change(screen.getByLabelText("Nombre y apellido"), { target: { value: "Persona ficticia" } });
  fireEvent.change(screen.getByLabelText("DNI"), { target: { value: "99000001" } });
  fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "persona@example.invalid" } });
  fireEvent.change(screen.getByLabelText("Contraseña", { exact: true }), { target: { value: "Ficticia-2026" } });
  fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: "Ficticia-2026" } });
  await submitForm();
}

async function registerCompany() {
  fireEvent.change(screen.getByLabelText("Nombre de la empresa"), { target: { value: "Empresa ficticia" } });
  fireEvent.change(screen.getByLabelText("CUIT"), { target: { value: "30999999997" } });
  fireEvent.change(screen.getByLabelText("Persona responsable"), { target: { value: "Responsable ficticio" } });
  fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "empresa@example.invalid" } });
  fireEvent.change(screen.getByLabelText("Actividad", { exact: true }), { target: { value: "Servicios ficticios" } });
  fireEvent.click(screen.getByRole("combobox", { name: "Localidad" }));
  fireEvent.click(screen.getByRole("option", { name: "Funes" }));
  fireEvent.change(screen.getByLabelText("Contraseña", { exact: true }), { target: { value: "Ficticia-2026" } });
  fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: "Ficticia-2026" } });
  await submitForm();
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
  // A fresh object per call: reusing one reference makes useActionState bail out on resubmission.
  mocks.verificationAction.mockImplementation(async () => ({ message: renewalMessage, success: true }));
  mocks.registerCandidateAction.mockImplementation(async () => ({ message: candidateMessage, success: true }));
  mocks.registerCompanyAction.mockImplementation(async () => ({ message: companyMessage, success: true }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("resend verification", () => {
  it("offers nothing before a registration was sent or without a captured email", () => {
    const view = render(<ResendVerification email="" active={false} />);
    expect(screen.queryByRole("button")).toBeNull();
    view.rerender(<ResendVerification email="persona@example.invalid" active={false} />);
    expect(screen.queryByRole("button")).toBeNull();
    view.rerender(<ResendVerification email="" active />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps the resend disabled for the whole 30 second cooldown", async () => {
    render(<ResendVerification email="persona@example.invalid" active />);
    expect(screen.getByText(prompt)).toBeTruthy();
    expect(screen.getByRole("button").textContent).toBe(`Reenviar en ${RESEND_COOLDOWN_SECONDS} s`);
    expect(screen.getByRole("button")).toHaveProperty("disabled", true);
    await advance(RESEND_COOLDOWN_SECONDS - 1);
    expect(screen.getByRole("button").textContent).toBe("Reenviar en 1 s");
    expect(screen.getByRole("button")).toHaveProperty("disabled", true);
    await advance(1);
    expect(screen.getByRole("button").textContent).toBe("Reenviar correo de confirmación");
    expect(screen.getByRole("button")).toHaveProperty("disabled", false);
  });

  it("resends to the registered email, reports the safe response and restarts the cooldown", async () => {
    render(<ResendVerification email="persona@example.invalid" active />);
    await advance(RESEND_COOLDOWN_SECONDS);
    await act(async () => { fireEvent.click(screen.getByRole("button")); });

    expect(mocks.verificationAction).toHaveBeenCalledOnce();
    const formData = mocks.verificationAction.mock.calls[0]?.[1] as FormData;
    expect(formData.get("email")).toBe("persona@example.invalid");
    expect(screen.getByRole("status").textContent).toBe(renewalMessage);
    expect(screen.getByRole("button").textContent).toBe(`Reenviar en ${RESEND_COOLDOWN_SECONDS} s`);
    expect(screen.getByRole("button")).toHaveProperty("disabled", true);
  });

  it("replaces the candidate form with a compact confirmation using the submitted email", async () => {
    render(<HomeAccessPanel />);
    fireEvent.click(modeTab("Registrarse"));
    await registerCandidate();

    expect(mocks.registerCandidateAction).toHaveBeenCalledOnce();
    const heading = screen.getByRole("heading", { name: confirmationTitle });
    expect(document.activeElement).toBe(heading);
    expect(within(heading.parentElement!).getByText(candidateMessage)).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Nombre y apellido" })).toBeNull();
    expect(screen.queryByText("Los campos marcados con * son obligatorios.")).toBeNull();
    expect(screen.queryByRole("group", { name: "Tipo de cuenta" })).toBeNull();
    expect(screen.getByRole("button", { name: `Reenviar en ${RESEND_COOLDOWN_SECONDS} s` })).toHaveProperty("disabled", true);
    expect(screen.getByRole("link", { name: "Volver a iniciar sesión" }).getAttribute("href")).toBe("/");

    await advance(RESEND_COOLDOWN_SECONDS);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Reenviar correo de confirmación" })); });
    expect((mocks.verificationAction.mock.calls[0]?.[1] as FormData).get("email")).toBe("persona@example.invalid");
  });

  it("replaces the company form with the same confirmation and its own message", async () => {
    render(<HomeAccessPanel />);
    fireEvent.click(modeTab("Registrarse"));
    fireEvent.click(screen.getByRole("radio", { name: "Empresa" }));
    await registerCompany();

    expect(mocks.registerCompanyAction).toHaveBeenCalledOnce();
    const heading = screen.getByRole("heading", { name: confirmationTitle });
    expect(within(heading.parentElement!).getByText(companyMessage)).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Nombre de la empresa" })).toBeNull();

    await advance(RESEND_COOLDOWN_SECONDS);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Reenviar correo de confirmación" })); });
    expect((mocks.verificationAction.mock.calls[0]?.[1] as FormData).get("email")).toBe("empresa@example.invalid");
  });

  it("keeps every entered value when the registration tab is activated again", async () => {
    render(<HomeAccessPanel />);
    fireEvent.click(modeTab("Registrarse"));
    await registerCandidate();
    expect(screen.getByRole("heading", { name: confirmationTitle })).toBeTruthy();

    fireEvent.click(modeTab("Registrarse"));

    expect(screen.queryByRole("heading", { name: confirmationTitle })).toBeNull();
    expect(screen.getByRole("group", { name: "Tipo de cuenta" })).toBeTruthy();
    expect((screen.getByLabelText("Nombre y apellido") as HTMLInputElement).value).toBe("Persona ficticia");
    expect((screen.getByLabelText("DNI") as HTMLInputElement).value).toBe("99000001");
    expect((screen.getByLabelText("Correo electrónico") as HTMLInputElement).value).toBe("persona@example.invalid");

    // Registering again with the kept values returns to the confirmation without retyping anything.
    await submitForm();
    expect(screen.getByRole("heading", { name: confirmationTitle })).toBeTruthy();
  });

  it("keeps the entered values after visiting the session tab and coming back", async () => {
    render(<HomeAccessPanel />);
    fireEvent.click(modeTab("Registrarse"));
    await registerCandidate();
    expect(screen.getByRole("heading", { name: confirmationTitle })).toBeTruthy();

    fireEvent.click(modeTab("Iniciar sesión"));
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeTruthy();

    fireEvent.click(modeTab("Registrarse"));

    expect((screen.getByLabelText("Nombre y apellido") as HTMLInputElement).value).toBe("Persona ficticia");
    expect((screen.getByLabelText("Correo electrónico") as HTMLInputElement).value).toBe("persona@example.invalid");
  });

  it("returns to the login card from the confirmation shortcut", async () => {
    render(<HomeAccessPanel />);
    fireEvent.click(modeTab("Registrarse"));
    await registerCandidate();

    fireEvent.click(screen.getByRole("link", { name: "Volver a iniciar sesión" }));

    expect(screen.queryByRole("heading", { name: confirmationTitle })).toBeNull();
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Nombre y apellido" })).toBeNull();
  });

  it("returns to the login form when the session tab is activated", async () => {
    render(<HomeAccessPanel />);
    fireEvent.click(modeTab("Registrarse"));
    await registerCandidate();

    fireEvent.click(modeTab("Iniciar sesión"));

    expect(screen.queryByRole("heading", { name: confirmationTitle })).toBeNull();
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeTruthy();
  });
});
