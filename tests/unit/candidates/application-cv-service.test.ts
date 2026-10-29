// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));
vi.mock("@/lib/files/cv-normalization", () => ({ normalizeCv: vi.fn() }));
vi.mock("@/features/participations/candidate-service", () => ({ applyToOffer: vi.fn() }));
import { readAccountSession } from "@/lib/auth/session";
import { normalizeCv } from "@/lib/files/cv-normalization";
import { applyToOffer } from "@/features/participations/candidate-service";
import { applyWithOptionalCv } from "@/features/participations/application-cv-service";
const id = "0a000000-0000-4000-8000-000000000001";
const input = { openingId: id, candidateVersion: 2 };
const rpc = vi.fn(), upload = vi.fn(), profile = vi.fn();
const file = () => new File(["fictitious"], "cv.png", { type: "image/png" });
beforeEach(() => {
  vi.clearAllMocks(); const query = { select: vi.fn(), eq: vi.fn(), is: vi.fn(), maybeSingle: profile };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.is.mockReturnValue(query);
  vi.mocked(readAccountSession).mockResolvedValue({ account: { id, role: "candidate", status: "active" },
    client: { from: () => query, rpc, storage: { from: () => ({ upload }) } } } as never);
  profile.mockResolvedValue({ data: { id, version: 2 }, error: null });
  rpc.mockResolvedValue({ data: "participation", error: null }); upload.mockResolvedValue({ error: null });
  vi.mocked(normalizeCv).mockResolvedValue({ safeName: "cv.pdf", bytes: new Uint8Array([1]), size: 1, sha256: "0".repeat(64) });
});
it("preserves the existing no-file command", async () => {
  await applyWithOptionalCv(input); expect(applyToOffer).toHaveBeenCalledWith(input); expect(rpc).not.toHaveBeenCalled();
});
it("reserves, uploads normalized PDF, then atomically applies without committing a general CV", async () => {
  expect(await applyWithOptionalCv(input, file())).toBe("participation");
  expect(rpc.mock.calls.map(call => call[0])).toEqual(["reserve_application_cv", "apply_to_opening_with_cv"]);
  expect(rpc.mock.invocationCallOrder[0]!).toBeLessThan(upload.mock.invocationCallOrder[0]!);
  expect(upload.mock.invocationCallOrder[0]!).toBeLessThan(rpc.mock.invocationCallOrder[1]!);
  expect(upload.mock.calls[0]![1].type).toBe("application/pdf");
  expect(rpc.mock.calls[0]![1].p_cv).toBe(rpc.mock.calls[1]![1].p_cv);
});
it("rejects stale profiles before normalization and storage", async () => {
  profile.mockResolvedValue({ data: { id, version: 3 }, error: null });
  await expect(applyWithOptionalCv(input, file())).rejects.toMatchObject({ code: "CONFLICT_STALE_DATA" });
  expect(normalizeCv).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled();
});
it("rejects invalid files before creating a reservation", async () => {
  vi.mocked(normalizeCv).mockResolvedValue(null);
  await expect(applyWithOptionalCv(input, file())).rejects.toMatchObject({ code: "VALIDATION_ERROR" }); expect(rpc).not.toHaveBeenCalled();
});
it("does not apply when reservation or storage fails", async () => {
  upload.mockResolvedValue({ error: { message: "private diagnostic" } });
  await expect(applyWithOptionalCv(input, file())).rejects.toMatchObject({ code: "INTERNAL_ERROR" }); expect(rpc).toHaveBeenCalledTimes(1);
});
