type Environment = Record<string, string | undefined>;
export type HostedIdentity = "admin1" | "admin2" | "admin3" | "admin4" | "candidate1" | "candidate2" | "candidate3" | "candidate4" | "company1" | "company2" | "company3" | "company4";
export function resolveHostedCredentials<T extends HostedIdentity>(identities: readonly T[], env?: Environment): Record<T, { email: string; password: string }>;
export function assertLocalTargets(env?: Environment): void;
export function localFixturePassword(env?: Environment): string;
