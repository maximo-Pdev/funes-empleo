export type AccessState = "suspended" | "session-expired" | "recovery-invalid";

const stateValues: Record<AccessState, string> = {
  suspended: "suspendido",
  "session-expired": "sesion-vencida",
  "recovery-invalid": "recuperacion-invalida",
};

/** Home is the only access surface: lifecycle states travel as one validated query value. */
export function getAccessHref(state: AccessState) {
  return `/?acceso=${stateValues[state]}`;
}

export function getAccessState(value: unknown): AccessState | null {
  if (typeof value !== "string") return null;
  const match = (Object.keys(stateValues) as AccessState[]).find(key => stateValues[key] === value);
  return match ?? null;
}
