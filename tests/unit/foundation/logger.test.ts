import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createRequestId, writeServerLog } from "@/lib/logging/logger";

describe("logger servidor con lista permitida", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("genera un identificador opaco por solicitud", () => {
    expect(createRequestId()).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i);
  });

  it("escribe solo campos permitidos, nunca metadatos ni errores arbitrarios", () => {
    const secret = "DNI-FICTICIO; token-secreto";
    writeServerLog({
      eventCode: "AUTHORIZATION",
      requestId: "9b2e593d-74e2-4a33-835e-10d647e4b9f7",
      result: "denied",
      role: "company",
      accountId: "a503243a-11d1-49b0-8f61-2c3181ac49c3",
      durationMs: 12.6,
      metadata: secret,
      error: new Error(secret),
    } as Parameters<typeof writeServerLog>[0]);

    const line = vi.mocked(console.warn).mock.calls[0]?.[0];
    expect(typeof line).toBe("string");
    expect(line).not.toContain(secret);
    expect(JSON.parse(line as string)).toMatchObject({
      eventCode: "AUTHORIZATION", result: "denied", role: "company", durationMs: 13,
    });
    expect(Object.keys(JSON.parse(line as string))).toEqual([
      "timestamp", "eventCode", "requestId", "result", "role", "accountId", "durationMs",
    ]);
  });

  it("sustituye un ID no confiable y descarta un identificador de cuenta inválido", () => {
    const requestId = writeServerLog({
      eventCode: "UNEXPECTED_ERROR", requestId: "correo@ejemplo.test", result: "error", accountId: "DNI-FICTICIO",
    });
    const line = vi.mocked(console.error).mock.calls[0]?.[0] as string;
    expect(line).not.toContain("correo@ejemplo.test");
    expect(line).not.toContain("DNI-FICTICIO");
    expect(JSON.parse(line).requestId).toBe(requestId);
  });
});
