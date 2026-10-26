export type RegistrationRole = "candidate" | "company";

export const HOME_REGISTRATION_EVENT = "home:registration";

const registrationValues: Record<RegistrationRole, string> = {
  candidate: "candidato",
  company: "empresa",
};

export function getRegistrationHref(role: RegistrationRole) {
  return `/?registro=${registrationValues[role]}`;
}

export function getRegistrationRole(value: unknown): RegistrationRole | null {
  if (value === "candidato") return "candidate";
  if (value === "empresa") return "company";
  return null;
}
