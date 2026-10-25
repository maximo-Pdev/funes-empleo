import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));
import { revalidatePath } from "next/cache";
import { readAccountSession } from "@/lib/auth/session";
import { confirmReportedOutcome } from "@/features/referrals/feedback-service";

const participationId = "872c795e-408a-872e-7a7e-15e04c803a98";
const contactId = "7fedbc5a-5f6a-2e4b-a4da-3105ab47ed2a";
const rpc = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockResolvedValue({ data: 4, error: null });
  vi.mocked(readAccountSession).mockResolvedValue({ account: { role: "admin", status: "active" }, client: { rpc } } as never);
});

it.each([false, true])("contratación tardía=%s usa un solo RPC atómico y actualiza vistas tras éxito", async lateCorrection => {
  expect(await confirmReportedOutcome({ participationId, expectedVersion: 3, outcome: "hired", lateCorrection,
    reason: "Contratación ficticia confirmada", contactId })).toEqual({ version: 4 });
  expect(rpc).toHaveBeenCalledTimes(1);
  expect(rpc).toHaveBeenCalledWith("transition_participation", {
    p_participation: participationId, p_expected_version: 3, p_command: lateCorrection ? "late_hire" : "hire",
    p_reason: "Contratación ficticia confirmada", p_feedback: null, p_contact: contactId,
  });
  expect(revalidatePath).toHaveBeenCalledWith("/admin/openings/[openingId]", "page");
  expect(revalidatePath).toHaveBeenCalledWith("/admin/atencion-presencial", "page");
  expect(revalidatePath).toHaveBeenCalledWith("/dashboard", "page");
  expect(revalidatePath).toHaveBeenCalledWith("/account", "page");
  expect(revalidatePath).toHaveBeenCalledWith("/company/openings/[openingId]/referrals", "page");
});

it.each(["candidate", "company"])("%s no puede contratar ni retirar consentimiento mediante el servidor", async role => {
  vi.mocked(readAccountSession).mockResolvedValue({ account: { role, status: "active" }, client: { rpc } } as never);
  await expect(confirmReportedOutcome({ participationId, expectedVersion: 3, outcome: "hired" })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
  expect(rpc).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
});

it("un rechazo de DB no dispara otro RPC de retiro ni invalida vistas como éxito", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "CONFLICT_STALE_DATA" } });
  await expect(confirmReportedOutcome({ participationId, expectedVersion: 3, outcome: "hired" })).rejects.toMatchObject({ code: "CONFLICT_STALE_DATA" });
  expect(rpc).toHaveBeenCalledTimes(1);
  expect(revalidatePath).not.toHaveBeenCalled();
});
