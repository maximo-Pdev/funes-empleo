// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));
vi.mock("@/features/participations/application-cv-service", async importOriginal => {
  const original = await importOriginal<typeof import("@/features/participations/application-cv-service")>();
  return { ...original, applyWithOptionalCv: vi.fn() };
});
import { readAccountSession } from "@/lib/auth/session";
import { applyWithOptionalCv, ApplicationCvError } from "@/features/participations/application-cv-service";
import { POST } from "@/app/api/candidate/applications/route";
import { MAX_CV_BYTES } from "@/lib/files/cv-policy";
const opening = "0a000000-0000-4000-8000-000000000001";
function request(file?: File, headers: Record<string, string> = {}, duplicate = false) {
  const form = new FormData(); form.set("openingId", opening); form.set("candidateVersion", "2");
  if (file) form.set("cv", file);
  if (duplicate) form.append("openingId", opening);
  return new Request("https://portal.example.test/api/candidate/applications", { method: "POST", body: form,
    headers: { host: "portal.example.test", origin: "https://portal.example.test", ...headers } });
}
beforeEach(() => {
  vi.clearAllMocks(); vi.mocked(readAccountSession).mockResolvedValue({ account: { role: "candidate", status: "active" } } as never);
  vi.mocked(applyWithOptionalCv).mockResolvedValue("participation");
});
it("accepts optional CV and responds without caching private data", async () => {
  const result = await POST(request()); expect(result.status).toBe(200);
  expect(result.headers.get("cache-control")).toBe("private, no-store");
  expect(result.headers.get("vary")).toBe("Cookie");
  expect(applyWithOptionalCv).toHaveBeenCalledWith({ openingId: opening, candidateVersion: "2" }, undefined);
});
it("passes an image to the protected normalization service", async () => {
  const result = await POST(request(new File(["fictitious"], "cv.png", { type: "image/png" })));
  expect(result.status).toBe(200);
  expect(vi.mocked(applyWithOptionalCv).mock.calls[0]![1]?.name).toBe("cv.png");
});
it.each(["anonymous", "company", "admin", "suspended"])("rejects %s before reading or writing", async role => {
  vi.mocked(readAccountSession).mockResolvedValue(role === "anonymous" ? null : { account: {
    role: role === "suspended" ? "candidate" : role, status: role === "suspended" ? "suspended" : "active",
  } } as never);
  expect((await POST(request())).status).toBe(role === "anonymous" ? 401 : 403);
  expect(applyWithOptionalCv).not.toHaveBeenCalled();
});
it.each<Record<string, string>>([
  { origin: "https://evil.example.test" }, { "sec-fetch-site": "cross-site" },
  { origin: "https://evil.example.test", "x-forwarded-host": "evil.example.test" }, { origin: "null" },
])("rejects cross-origin and forwarded-header spoofing %j", async headers => {
  expect((await POST(request(undefined, headers))).status).toBe(403);
  expect(applyWithOptionalCv).not.toHaveBeenCalled();
});
it("rejects duplicate fields", async () => {
  expect((await POST(request(undefined, {}, true))).status).toBe(422); expect(applyWithOptionalCv).not.toHaveBeenCalled();
});
it("bounds actual multipart bytes even without Content-Length", async () => {
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MAX_CV_BYTES + 65537)); controller.close(); } });
  const oversized = new Request("https://portal.example.test/api/candidate/applications", { method: "POST", body,
    headers: { host: "portal.example.test", origin: "https://portal.example.test", "content-type": "multipart/form-data; boundary=fake" }, duplex: "half" } as RequestInit);
  expect((await POST(oversized)).status).toBe(422);
  expect(applyWithOptionalCv).not.toHaveBeenCalled();
});
it("returns a specific, safe field error without exposing server diagnostics", async () => {
  vi.mocked(applyWithOptionalCv).mockRejectedValue(new ApplicationCvError());
  const result = await POST(request(new File(["invalid"], "cv.webp")));
  expect(result.status).toBe(422); expect(await result.json()).toMatchObject({ field: "cv", success: false });
});
