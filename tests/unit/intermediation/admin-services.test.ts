import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));

import { readAccountSession } from "@/lib/auth/session";
import { moderateOpening } from "@/features/openings/admin-service";
import { recordEvaluation } from "@/features/participations/evaluation-service";

const openingId = "2ea4cdc3-2bde-90ca-b1b3-fe159516a9fd";
const participationId = "872c795e-408a-872e-7a7e-15e04c803a98";
const candidateId = "7fedbc5a-5f6a-2e4b-a4da-3105ab47ed2a";
const rpc = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockResolvedValue({ data: 3, error: null });
  vi.mocked(readAccountSession).mockResolvedValue({
    account: { role: "admin", status: "active" }, client: { rpc },
  } as never);
});

describe("servicios administrativos US1", () => {
  it("mapea la moderación a la función SQL sin publicar el motivo interno", async () => {
    expect(await moderateOpening({ openingId, version: 2, decision: "changes_requested",
      publicMessage: "Completá el horario.", internalReason: "Revisión interna" })).toEqual({ version: 3 });
    expect(rpc).toHaveBeenCalledWith("transition_opening", {
      p_opening: openingId, p_expected_version: 2, p_command: "request_changes",
      p_reason: "Revisión interna", p_company_message: "Completá el horario.",
    });
  });

  it("niega a la empresa y traduce el conflicto de versión sin datos SQL", async () => {
    vi.mocked(readAccountSession).mockResolvedValue({ account: { role: "company", status: "active" }, client: { rpc } } as never);
    await expect(moderateOpening({ openingId, version: 2, decision: "approved" })).rejects.toMatchObject({ code: "ACCESS_DENIED" });
    expect(rpc).not.toHaveBeenCalled();
    vi.mocked(readAccountSession).mockResolvedValue({ account: { role: "admin", status: "active" }, client: { rpc } } as never);
    rpc.mockResolvedValue({ data: null, error: { message: "CONFLICT_STALE_DATA" } });
    await expect(moderateOpening({ openingId, version: 2, decision: "approved" })).rejects.toMatchObject({ code: "CONFLICT_STALE_DATA" });
  });

  it("registra la preentrevista con fecha, resumen y motivo de salto", async () => {
    await recordEvaluation({ command: "record_preinterview", participationId, version: 2,
      channel: "phone", heldAt: "2026-09-23T15:00:00Z", summary: "Entrevista ficticia",
      reason: "Omisión de revisión documentada" });
    expect(rpc).toHaveBeenCalledWith("record_preinterview", {
      p_participation: participationId, p_expected_version: 2, p_channel: "phone",
      p_scheduled_at: null, p_held_at: "2026-09-23T15:00:00Z",
      p_summary: "Entrevista ficticia", p_recommendation: "pending",
      p_skip_reason: "Omisión de revisión documentada",
    });
  });

  it("registra contacto y nota mediante RPC append-only con versión", async () => {
    await recordEvaluation({ command: "record_contact", participationId, version: 2,
      channel: "whatsapp", direction: "inbound", occurredAt: "2026-09-23T15:00:00Z",
      summary: "Solicitud ficticia" });
    expect(rpc).toHaveBeenCalledWith("record_contact", expect.objectContaining({
      p_participation: participationId, p_expected_version: 2, p_direction: "inbound",
    }));
    rpc.mockResolvedValue({ data: "e3d17778-8316-70b5-8635-08aa50ff2c4a", error: null });
    await recordEvaluation({ command: "record_training_guidance", candidateId,
      version: 2, body: "Orientación ficticia" });
    expect(rpc).toHaveBeenCalledWith("record_internal_note", expect.objectContaining({
      p_candidate: candidateId, p_expected_version: 2, p_participation: null,
      p_kind: "training_guidance", p_body: "Orientación ficticia",
    }));
  });
});
