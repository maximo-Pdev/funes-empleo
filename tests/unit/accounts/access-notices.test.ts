import { describe, expect, it } from "vitest";
import { getAccessHref, getAccessState } from "@/features/accounts/access-notices";

const states = ["suspended", "session-expired", "recovery-invalid"] as const;

describe("access states", () => {
  it("keeps the canonical Home hrefs", () => {
    expect(getAccessHref("suspended")).toBe("/?acceso=suspendido");
    expect(getAccessHref("session-expired")).toBe("/?acceso=sesion-vencida");
    expect(getAccessHref("recovery-invalid")).toBe("/?acceso=recuperacion-invalida");
  });

  it("round-trips every canonical value", () => {
    for (const state of states) {
      expect(getAccessState(getAccessHref(state).replace("/?acceso=", ""))).toBe(state);
    }
  });

  it("rejects unknown, malformed or array values instead of guessing", () => {
    for (const value of [undefined, null, "", "suspendida", "SUSPENDIDO", "sesion-vencida ", ["suspendido"]]) {
      expect(getAccessState(value)).toBeNull();
    }
  });
});
