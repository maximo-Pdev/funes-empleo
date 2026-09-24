import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));
vi.mock("@/features/accounts/service", () => ({ changeAccountStatus: vi.fn() }));

import { revalidatePath } from "next/cache";
import { readAccountSession } from "@/lib/auth/session";
import { changeAccountStatus } from "@/features/accounts/service";
import { candidateAccountDecisionAction } from "@/features/candidates/admin-actions";

const accountId = "2ea4cdc3-2bde-90ca-b1b3-fe159516a9fd";
const payload = { resource: "candidate_account", resourceId: accountId,
  version: 2, action: "suspend", reason: "Revisión ficticia", confirmed: true };

function mockSession(role: string, targetRole = "candidate") {
  const maybeSingle = vi.fn().mockResolvedValue({ data: { role: targetRole }, error: null });
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  vi.mocked(readAccountSession).mockResolvedValue({ account: { role, status: "active" },
    client: { from: vi.fn(() => query) } } as never);
}

describe("decisiones sobre cuenta candidata", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rechaza cuentas no administrativas, destinos ajenos y falta de confirmación", async () => {
    mockSession("company");
    expect(await candidateAccountDecisionAction(payload)).toEqual({ code: "DENIED" });
    expect(changeAccountStatus).not.toHaveBeenCalled();
    mockSession("admin", "company");
    expect(await candidateAccountDecisionAction(payload)).toEqual({ code: "DENIED" });
    expect(changeAccountStatus).not.toHaveBeenCalled();
    expect(await candidateAccountDecisionAction({ ...payload, confirmed: false })).toEqual({ code: "INVALID_INPUT" });
  });

  it("propaga el conflicto sin divulgar la respuesta SQL", async () => {
    mockSession("admin");
    vi.mocked(changeAccountStatus).mockResolvedValue({ code: "CONFLICT_STALE_DATA" });
    expect(await candidateAccountDecisionAction(payload)).toEqual({ code: "CONFLICT_STALE_DATA" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("invalida vistas administrativas luego de una decisión registrada", async () => {
    mockSession("admin");
    vi.mocked(changeAccountStatus).mockResolvedValue({ code: "OK", version: 3 });
    expect(await candidateAccountDecisionAction(payload)).toEqual({ code: "OK" });
    expect(changeAccountStatus).toHaveBeenCalledWith({ accountId, version: 2,
      command: "suspend", reason: "Revisión ficticia", confirmed: true });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/candidates");
  });
});
