import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/features/candidates/duplicate-service", () => ({ assistedAdminSession: vi.fn(), duplicateMatchSchema: {} }));
import { assistedAdminSession } from "@/features/candidates/duplicate-service";
import { saveAssistedCandidate } from "@/features/candidates/assisted-service";
const rpc = vi.fn();
const id = "04000000-0000-4000-8000-000000000001";
const data = { name: "Persona ficticia", dni: "98000001", phone: "3410000000", email: "", locality: "Funes", summary: "Experiencia ficticia", availability: "available", detail: "", address: "", categories: [id] };
const input = { candidateId: null, version: null, data, resolution: null };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(assistedAdminSession).mockResolvedValue({ client: { rpc } } as never);
  rpc.mockResolvedValue({ data: { status: "saved", candidateId: id }, error: null });
});
it("crea mediante un único RPC que guarda y activa atómicamente sin consentimiento", async () => {
  await expect(saveAssistedCandidate(input)).resolves.toEqual({ status: "saved", candidateId: id });
  expect(rpc).toHaveBeenCalledTimes(1);
  expect(rpc).toHaveBeenCalledWith("create_active_assisted_candidate", expect.objectContaining({ p_data: data }));
});
it.each([
  ...[{ locality: "" }, { summary: "" }, { categories: [] }, { availability: "unavailable" }].map(change => ({ ...input, data: { ...data, ...change } })),
])("rechaza un alta sin requisitos antes de escribir", async invalid => {
  await expect(saveAssistedCandidate(invalid)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  expect(rpc).not.toHaveBeenCalled();
});
it("actualizar un existente conserva el RPC previo sin reaceptación automática", async () => {
  await saveAssistedCandidate({ candidateId: id, version: 2, data: { ...data, locality: "", summary: "", categories: [] }, resolution: null });
  expect(rpc).toHaveBeenCalledWith("save_assisted_candidate", expect.objectContaining({ p_candidate: id, p_expected_version: 2 }));
});
it("un fallo del comando no dispara pasos de consentimiento o activación posteriores", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "INVALID_TRANSITION" } });
  await expect(saveAssistedCandidate(input)).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  expect(rpc).toHaveBeenCalledTimes(1);
});
