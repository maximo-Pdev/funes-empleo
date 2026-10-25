// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), upload: vi.fn(), rpc: vi.fn(), profile: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: mocks.session }));
vi.mock("@/lib/env/client", () => ({ getClientEnvironment: () => ({ NEXT_PUBLIC_APP_URL: "https://portal.example.test" }) }));
vi.mock("@/lib/files/pdf-validation", () => ({ validatePdf: () => ({ safeName: "cv-ficticio.pdf", size: 5, sha256: "fixture", bytes: new Uint8Array([1]) }) }));
import { POST } from "@/app/api/candidate/cv/route";
const id = "0a000000-0000-4000-8000-000000000001";
function session(role = "candidate") {
 return { account: { id: "candidate-fixture", role, status: "active" }, client: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.profile }) }) }),
  rpc: mocks.rpc, storage: { from: () => ({ upload: mocks.upload }) },
 } };
}
beforeEach(() => {
 vi.clearAllMocks(); mocks.session.mockResolvedValue(session());
 mocks.profile.mockResolvedValue({ data: { id, account_id: "candidate-fixture", version: 1, archived_at: null }, error: null });
 mocks.rpc.mockResolvedValue({ error: null }); mocks.upload.mockResolvedValue({ error: null });
});
async function submit(returnTo?: string, valid = false) {
 const form = new FormData(); form.set("candidateId", id); form.set("version", "1");
 if (returnTo) form.set("returnTo", returnTo);
 if (valid) form.set("cv", new File(["dummy"], "cv-ficticio.pdf", { type: "application/pdf" }));
 return POST(new Request("https://portal.example.test/api/candidate/cv", { method: "POST", body: form }));
}
it.each([false, true])("returns account uploads to the selected profile for valid=%s", async valid => {
 const response = await submit("/account?section=perfil", valid);
 expect(response.status).toBe(303);
 const url = new URL(response.headers.get("location")!);
 expect(url.pathname).toBe("/account"); expect(url.searchParams.get("section")).toBe("perfil");
 expect(url.searchParams.get("cv")).toBe(valid ? "ok" : "invalid");
 expect(response.headers.get("cache-control")).toBe("private, no-store");
 if (!valid) { expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.upload).not.toHaveBeenCalled(); }
});
it.each([undefined, "https://evil.example.test", "//evil.example.test", "/account?section=ofertas", "/admin/candidates/other"])("uses the dashboard profile for unsupported returnTo=%s", async returnTo => {
 const response = await submit(returnTo);
 expect(response.headers.get("location")).toBe("https://portal.example.test/dashboard?section=perfil&cv=invalid");
});
it("preserves the administrative destination regardless of candidate return context", async () => {
 mocks.session.mockResolvedValue(session("admin"));
 const response = await submit("/account?section=perfil");
 expect(new URL(response.headers.get("location")!).pathname).toBe(`/admin/candidates/${id}`);
});
it.each(["/account?section=perfil&x=1", "/account?section=perfil#x", "/account?section=%70erfil", "/account/?section=perfil", "/account?section=perfil "])("rejects nonexact account return %s", async value => {
 const response = await submit(value);
 expect(response.headers.get("location")).toBe("https://portal.example.test/dashboard?section=perfil&cv=invalid");
 expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.upload).not.toHaveBeenCalled();
});
it.each(["company", "candidate-suspended"])("denies ineligible session %s without writes", async mode => {
 const value = session(mode === "company" ? "company" : "candidate");
 if (mode === "candidate-suspended") value.account.status = "suspended";
 mocks.session.mockResolvedValue(value);
 const response = await submit("/account?section=perfil", true);
 expect(response.headers.get("location")).toBe("https://portal.example.test/?cv=denied");
 expect(mocks.profile).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.upload).not.toHaveBeenCalled();
});
it.each(["foreign", "archived", "stale"])("preserves profile protection %s without writes", async mode => {
 mocks.profile.mockResolvedValue({ data: { id, account_id: mode === "foreign" ? "other" : "candidate-fixture", archived_at: mode === "archived" ? "2026-01-01" : null, version: mode === "stale" ? 2 : 1 }, error: null });
 const response = await submit("/account?section=perfil", true);
 expect(response.headers.get("location")).toBe(`https://portal.example.test/account?section=perfil&cv=${mode === "stale" ? "conflict" : "denied"}`);
 expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.upload).not.toHaveBeenCalled();
});
it("preserves authentication denial before parsing return context", async () => {
 mocks.session.mockResolvedValue(null);
 const response = await submit("/account?section=perfil");
 expect(response.headers.get("location")).toBe("https://portal.example.test/?cv=denied");
 expect(mocks.profile).not.toHaveBeenCalled();
});

it.each([false, true])("returns dashboard uploads to the profile with feedback for valid=%s", async valid => {
 const response = await submit("/dashboard?section=perfil", valid);
 expect(response.status).toBe(303);
 expect(response.headers.get("location")).toBe(`https://portal.example.test/dashboard?section=perfil&cv=${valid ? "ok" : "invalid"}`);
 expect(response.headers.get("cache-control")).toBe("private, no-store");
});

it.each(["/dashboard?section=perfil&x=1", "/dashboard?section=perfil#x", "/dashboard?section=%70erfil"])("rejects nonexact dashboard return %s", async value => {
 const response = await submit(value);
 expect(response.headers.get("location")).toBe("https://portal.example.test/dashboard?section=perfil&cv=invalid");
 expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.upload).not.toHaveBeenCalled();
});

it("returns malformed administrative uploads to the candidate administration list", async () => {
 mocks.session.mockResolvedValue(session("admin"));
 const response = await POST(new Request("https://portal.example.test/api/candidate/cv", { method: "POST", body: new FormData() }));
 expect(response.status).toBe(303);
 expect(response.headers.get("location")).toBe("https://portal.example.test/admin/candidates?cv=invalid");
 expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.upload).not.toHaveBeenCalled();
});
