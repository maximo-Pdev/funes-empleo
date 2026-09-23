import "server-only";
import { randomUUID } from "node:crypto";
import { USER_ROLES, type UserRole } from "@/domain/catalogs";

export const LOG_EVENT_CODES = [
  "AUTH", "AUTHORIZATION", "VALIDATION", "WORKFLOW", "FILE", "IMPORT",
  "EXPORT", "AUTOMATION", "UNEXPECTED_ERROR",
] as const;
export type LogEventCode = (typeof LOG_EVENT_CODES)[number];
export type LogResult = "success" | "denied" | "error";

export interface ServerLogInput {
  eventCode: LogEventCode;
  requestId: string;
  result: LogResult;
  role?: UserRole | "system";
  accountId?: string;
  durationMs?: number;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createRequestId(): string {
  return randomUUID();
}

// Construct a fresh record from an explicit allowlist. Do not spread caller
// objects, stringify errors, or accept arbitrary metadata, request headers,
// names, contact data, document paths, cookies, tokens or file contents.
export function writeServerLog(input: ServerLogInput): string {
  const requestId = UUID_PATTERN.test(input.requestId) ? input.requestId : createRequestId();
  const record: Record<string, string | number> = {
    timestamp: new Date().toISOString(),
    eventCode: LOG_EVENT_CODES.includes(input.eventCode) ? input.eventCode : "UNEXPECTED_ERROR",
    requestId,
    result: ["success", "denied", "error"].includes(input.result) ? input.result : "error",
  };
  if (input.role === "system") record.role = "system";
  else if (input.role && USER_ROLES.some((role) => role === input.role)) record.role = input.role;
  if (input.accountId && UUID_PATTERN.test(input.accountId)) record.accountId = input.accountId;
  if (Number.isFinite(input.durationMs) && input.durationMs !== undefined && input.durationMs >= 0) {
    record.durationMs = Math.round(input.durationMs);
  }

  const line = JSON.stringify(record);
  if (record.result === "error") console.error(line);
  else if (record.result === "denied") console.warn(line);
  else console.info(line);
  return requestId;
}
