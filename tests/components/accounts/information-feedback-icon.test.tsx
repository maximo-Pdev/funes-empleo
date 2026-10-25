import { beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { AuthForm } from "@/features/accounts/components/auth-form";
import { CandidateRegistrationForm } from "@/features/candidates/components/candidate-registration-form";
import { CompanyRegistrationForm } from "@/features/companies/components/company-registration-form";
import { HomeAccessPanel } from "@/app/(public)/home-access-panel";

const response = vi.hoisted(() => ({ state: { message: "", success: false }, pending: false }));
vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useActionState: () => [response.state, vi.fn(), response.pending],
}));
vi.mock("@/features/accounts/actions", () => ({ loginAction: vi.fn(), recoveryAction: vi.fn(), verificationAction: vi.fn(), passwordAction: vi.fn() }));
vi.mock("@/features/candidates/registration-actions", () => ({ registerCandidateAction: vi.fn() }));
vi.mock("@/features/companies/company-actions", () => ({ registerCompanyAction: vi.fn() }));

beforeEach(() => {
  response.state = { message: "", success: false };
  response.pending = false;
});

const forms = ["login", "candidate", "company"] as const;
function renderForm(kind: typeof forms[number], homepageLayout = true) {
  return render(kind === "login" ? <AuthForm mode="login" homepageLayout={homepageLayout} />
    : kind === "candidate" ? <CandidateRegistrationForm homepageLayout={homepageLayout} />
      : <CompanyRegistrationForm homepageLayout={homepageLayout} />);
}

it.each(forms)("uses a decorative Lucide Info icon for %s informational feedback", kind => {
  response.state = { message: "Si los datos son válidos, recibirás un enlace para verificar tu correo. Revisá también spam.", success: true };
  renderForm(kind);
  const feedback = screen.getByRole("status");
  const icon = feedback.querySelector("svg.lucide-info");
  expect(icon).not.toBeNull();
  expect(icon?.getAttribute("aria-hidden")).toBe("true");
  expect(feedback.textContent).toBe(response.state.message);
  expect(document.activeElement).toBe(feedback);
});

it.each(forms)("does not add an information icon to %s errors", kind => {
  response.state = { message: "Revisá los datos ingresados.", success: false };
  renderForm(kind);
  expect(screen.getByRole(kind === "login" ? "status" : "alert").querySelector("svg")).toBeNull();
});

it.each(forms)("leaves the initial %s feedback genuinely empty", kind => {
  renderForm(kind);
  const feedback = screen.getByRole(kind === "login" ? "status" : "alert");
  expect(feedback.childNodes.length).toBe(0);
});

it.each(forms)("preserves standalone %s feedback", kind => {
  response.state = { message: "Información de prueba", success: true };
  renderForm(kind, false);
  expect(screen.getByRole("status").querySelector("svg")).toBeNull();
});

it("uses the same icon for the pending login notice", () => {
  response.pending = true;
  renderForm("login");
  expect(screen.getByRole("status").querySelector("svg.lucide-info")).not.toBeNull();
  expect(screen.getByRole("status").textContent).toBe("Procesando tu solicitud…");
});

it("uses the same icon for the existing active-session notice", () => {
  render(<HomeAccessPanel authenticated panelHref="/dashboard" />);
  expect(screen.getByRole("status").querySelector("svg.lucide-info")).not.toBeNull();
  expect(screen.getByRole("link", { name: "Ir al panel de usuario" }).getAttribute("href")).toBe("/dashboard");
});

it("defines the approved informational color as a global semantic token", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  expect(css).toMatch(/--color-feedback-info:\s*#5758D6\s*;/);
});
