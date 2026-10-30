import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AccountChangeForm } from "@/features/accounts/components/account-change-form";
import { AdminCompanyDecision } from "@/features/companies/components/admin-company-decision";
import { SafetyDecisionForm } from "@/features/participations/components/safety-decision-form";
import styles from "@/features/accounts/components/account-decision.module.css";

vi.mock("@/features/accounts/actions", () => ({ accountStatusAction: vi.fn() }));
vi.mock("@/features/companies/admin-actions", () => ({ adminCompanyAction: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

it.each(["account", "company", "candidate"])("reactivar %s usa primario verde y conserva validación", kind => {
  const submit = vi.fn();
  const view = render(kind === "account" ? <AccountChangeForm id="ficticio" version={2} command="reactivate" />
    : kind === "company" ? <AdminCompanyDecision accountId="ficticio" version={2} command="reactivate" />
      : <SafetyDecisionForm resource="candidate_account" resourceId="ficticio" version={2} action="reactivate" onSubmit={submit} />);
  const button = screen.getByRole("button", { name: kind === "company" ? "Reactivar empresa" : "Reactivar cuenta" });
  expect(button.className).toContain("bg-primary");
  expect(button).toHaveProperty("type", "submit");
  expect(button.closest("form")?.className.split(/\s+/)).toContain(styles.reactivation);
  fireEvent.click(button);
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox").getAttribute("aria-invalid")).toBe("true");
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Motivo ficticio conservado" } });
  fireEvent.click(button);
  expect(screen.getByRole("textbox")).toHaveProperty("value", "Motivo ficticio conservado");
  expect(view.container.querySelector('input[type="checkbox"]')).toHaveProperty("required", true);
});

it.each(["account", "company", "candidate"])("suspender %s mantiene variante de peligro", kind => {
  render(kind === "account" ? <AccountChangeForm id="ficticio" version={2} command="suspend" />
    : kind === "company" ? <AdminCompanyDecision accountId="ficticio" version={2} command="suspend" />
      : <SafetyDecisionForm resource="candidate_account" resourceId="ficticio" version={2} action="suspend" onSubmit={vi.fn()} />);
  const button = screen.getByRole("button", { name: kind === "company" ? "Suspender empresa" : "Suspender cuenta" });
  expect(button.className).toContain("bg-red-800");
  expect(button.closest("form")?.className.split(/\s+/)).not.toContain(styles.reactivation);
});
