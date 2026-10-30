import { beforeEach, expect, it, vi } from "vitest";
const provider = vi.hoisted(() => ({ rpc: vi.fn(), invite: vi.fn(), configured: true }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc: provider.rpc, auth: { admin: { inviteUserByEmail: provider.invite } } }) }));
vi.mock("@/lib/env/client", () => ({ getClientEnvironment: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://example.test", NEXT_PUBLIC_APP_URL: "https://portal.example.test" }) }));
vi.mock("@/lib/env/server", () => ({ getServerEnvironment: () => ({ SUPABASE_SECRET_KEY: provider.configured ? "fictitious-mock-only" : undefined }) }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ inviteIndividualAdministrator: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { readAccountSession } from "@/lib/auth/session";
import { inviteIndividualAdministrator } from "@/lib/supabase/admin";
import { administratorInvitationAction } from "@/features/accounts/admin-invitation-actions";

const actor = "00000000-0000-4000-8000-000000000001";
function form() {
  const data = new FormData();
  data.set("email", "staff@example.test");
  data.set("confirmed", "on");
  data.set("actor", "untrusted");
  data.set("role", "candidate");
  return data;
}
beforeEach(() => {
  provider.configured = true;
  provider.rpc.mockResolvedValue({ data: "fictitious-reservation", error: null });
  provider.invite.mockResolvedValue({ error: null });
  vi.clearAllMocks();
  vi.mocked(readAccountSession).mockResolvedValue({ account: { id: actor, role: "admin", status: "active" } } as never);
  vi.mocked(inviteIndividualAdministrator).mockResolvedValue(undefined);
});
it.each([null, { role: "candidate", status: "active" }, { role: "company", status: "active" }, { role: "admin", status: "suspended" }, { role: "admin", status: "archived" }, { role: "admin", status: "pending_verification" }])("denies direct action calls from unauthorized sessions: %j", async account => {
  vi.mocked(readAccountSession).mockResolvedValue(account ? { account: { id: actor, ...account } } as never : null);
  expect((await administratorInvitationAction({ message: "", success: false }, form())).success).toBe(false);
  expect(inviteIndividualAdministrator).not.toHaveBeenCalled();
});
it.each(["", "yes", "true"])("requires explicit confirmation, rejecting %s", async confirmation => {
  const data = form(); data.set("confirmed", confirmation);
  expect((await administratorInvitationAction({ message: "", success: false }, data)).success).toBe(false);
  expect(inviteIndividualAdministrator).not.toHaveBeenCalled();
});
it.each(["", "invalid", "a@example.test,b@example.test"])("rejects invalid individual email %s", async email => {
  const data = form(); data.set("email", email);
  expect((await administratorInvitationAction({ message: "", success: false }, data)).success).toBe(false);
  expect(inviteIndividualAdministrator).not.toHaveBeenCalled();
});
it.each(["ADMIN_PROVISIONING_NOT_CONFIGURED", "ADMIN_PROVISIONING_FAILED", "private provider details"])("reports sanitized failure without claiming delivery: %s", async message => {
  vi.mocked(inviteIndividualAdministrator).mockRejectedValue(new Error(message));
  const result = await administratorInvitationAction({ message: "", success: false }, form());
  expect(result.success).toBe(false);
  expect(result.message).toContain("No se pudo enviar");
  expect(result.message).not.toContain(message);
});
it("preserves the privileged reservation and individual password callback contract (mock provider)", async () => {
  const helper = await vi.importActual<typeof import("@/lib/supabase/admin")>("@/lib/supabase/admin");
  await helper.inviteIndividualAdministrator("staff@example.test", actor);
  expect(provider.rpc).toHaveBeenCalledExactlyOnceWith("reserve_administrator_invitation", { p_email: "staff@example.test", p_actor: actor });
  expect(provider.invite).toHaveBeenCalledExactlyOnceWith("staff@example.test", { redirectTo: "https://portal.example.test/auth/callback?next=/update-password", data: { portal_invitation: "fictitious-reservation" } });
});
it.each(["configuration", "reservation", "provider"])("existing privileged helper rejects %s failure without false success", async boundary => {
  const helper = await vi.importActual<typeof import("@/lib/supabase/admin")>("@/lib/supabase/admin");
  if (boundary === "configuration") provider.configured = false;
  if (boundary === "reservation") provider.rpc.mockResolvedValue({ data: null, error: { message: "private" } });
  if (boundary === "provider") provider.invite.mockResolvedValue({ error: { message: "private" } });
  await expect(helper.inviteIndividualAdministrator("staff@example.test", actor)).rejects.toThrow(/ADMIN_PROVISIONING/);
  if (boundary !== "provider") expect(provider.invite).not.toHaveBeenCalled();
});
it("invites one individual using only the verified administrator identity", async () => {
  const result = await administratorInvitationAction({ message: "", success: false }, form());
  expect(result.success).toBe(true);
  expect(inviteIndividualAdministrator).toHaveBeenCalledExactlyOnceWith("staff@example.test", actor);
});
