import { readFileSync } from "node:fs";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { ParticipationStatus } from "@/domain/states";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { ParticipationActionForm } from "@/features/participations/components/participation-action-form";

it("la fase preparada para concurrencia ofrece la acción real que se medirá", () => {
  const setup = readFileSync("tests/fixtures/prepare-demo-concurrency.sql", "utf8");
  const runner = readFileSync("tests/quality/demo-performance.mjs", "utf8");
  const stage = setup.match(/update public\.participations set status='([^']+)'/);
  const command = runner.match(/pages\[1\]\.getByLabel\("Acción",\{exact:true\}\)\.selectOption\("([^"]+)"\)/);
  expect(stage).not.toBeNull(); expect(command).not.toBeNull();
  const submit = vi.fn();
  render(<ParticipationActionForm participationId="fixture-775" version={2}
    status={stage![1] as ParticipationStatus} onSubmit={submit} />);
  const choices = screen.getAllByRole("option").map(option => (option as HTMLOptionElement).value);
  expect(choices, "La preparación debe llegar a la barrera usando una opción disponible").toContain(command![1]);
  fireEvent.change(screen.getByLabelText("Acción"), { target: { value: command![1] } });
  fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }));
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ command: command![1] }));
});
