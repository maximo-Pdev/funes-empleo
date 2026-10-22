import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ inviteIndividualAdministrator: vi.fn() }));
import { readAccountSession } from "@/lib/auth/session";
import { changeAccountStatus } from "@/features/accounts/service";

const accountId = "00000000-0000-4000-8000-000000000001";
const rpc = vi.fn();
const input = { accountId, version: 1, command: "archive", reason: "Motivo ficticio", confirmed: true };
beforeEach(() => { vi.clearAllMocks(); rpc.mockResolvedValue({ data: 2, error: null }); });

it.each(["candidate", "company"])("%s no puede autoarchivarse ni modificar cuentas por servidor", async role => {
  vi.mocked(readAccountSession).mockResolvedValue({ account: { id: accountId, role, status: "active" }, client: { rpc } } as never);
  for (const command of ["archive", "suspend", "reactivate", "restore"]) {
    expect(await changeAccountStatus({ ...input, command })).toEqual({ code: "DENIED" });
  }
  expect(rpc).not.toHaveBeenCalled();
});

it("administración conserva archivo con confirmación/motivo y control de versión", async () => {
  vi.mocked(readAccountSession).mockResolvedValue({ account: { id: accountId, role: "admin", status: "active" }, client: { rpc } } as never);
  expect(await changeAccountStatus(input)).toEqual({ code: "OK", version: 2 });
  expect(rpc).toHaveBeenCalledWith("change_account_status", { p_account: accountId, p_version: 1, p_command: "archive", p_reason: "Motivo ficticio", p_confirmed: true });
  rpc.mockResolvedValue({ data: null, error: { message: "CONFLICT_STALE_DATA" } });
  expect(await changeAccountStatus(input)).toEqual({ code: "CONFLICT_STALE_DATA" });
});
