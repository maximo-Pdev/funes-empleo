import { AppError } from "@/lib/errors/public-error";
import type { OpeningStatus } from "@/domain/states";

export type OpeningCommand = "submit" | "approve" | "request_changes" | "reject" | "pause" |
  "resume" | "close" | "suspend" | "restore_to_draft" | "cancel" | "auto_close";

type OpeningActor = "company" | "admin" | "system";

export interface OpeningTransitionInput {
  actor: OpeningActor;
  status: OpeningStatus;
  version: number;
  expectedVersion: number;
  command: OpeningCommand;
  reason?: string;
  companyMessage?: string;
  complete: boolean;
  companyActive: boolean;
  archived: boolean;
  closingDate: string;
  now: Date;
}

export interface OpeningDecision {
  nextStatus: OpeningStatus;
  auditAction: string;
  cancelOpenParticipations: boolean;
}

const terminal = new Set<OpeningStatus>(["closed", "rejected", "cancelled"]);

// Compare calendar dates in the municipal timezone; the offer is valid through
// 23:59:59.999 of its closing date, not through midnight at its start.
export function isOpeningExpired(closingDate: string, now: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(closingDate) || Number.isNaN(now.getTime())) return false;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const component = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const today = `${component("year")}-${component("month")}-${component("day")}`;
  return today > closingDate;
}

export function decideOpeningTransition(input: OpeningTransitionInput): OpeningDecision {
  if (input.version !== input.expectedVersion) throw new AppError("CONFLICT_STALE_DATA");
  if (input.archived) throw new AppError("INVALID_TRANSITION");
  if (input.command === "auto_close") {
    if (input.actor !== "system") throw new AppError("ACCESS_DENIED");
    if (input.status !== "published" || !isOpeningExpired(input.closingDate, input.now)) throw new AppError("INVALID_TRANSITION");
    return { nextStatus: "closed", auditAction: "opening_auto_closed", cancelOpenParticipations: false };
  }
  if (input.command === "submit") {
    if (input.actor !== "company") throw new AppError("ACCESS_DENIED");
    if (input.status !== "draft" && input.status !== "changes_requested") throw new AppError("INVALID_TRANSITION");
    if (!input.companyActive || !input.complete || isOpeningExpired(input.closingDate, input.now)) throw new AppError("VALIDATION_ERROR");
    return { nextStatus: "pending_review", auditAction: "opening_submitted", cancelOpenParticipations: false };
  }
  if (input.actor !== "admin") throw new AppError("ACCESS_DENIED");
  const reason = input.reason?.trim();
  const message = input.companyMessage?.trim();
  const reasonRequired = new Set<OpeningCommand>(["reject", "pause", "close", "suspend", "restore_to_draft", "cancel"]);
  if (reasonRequired.has(input.command) && (!reason || reason.length > 1_000)) throw new AppError("VALIDATION_ERROR");
  if ((input.command === "request_changes" || input.command === "reject") && (!message || message.length > 2_000)) throw new AppError("VALIDATION_ERROR");
  const map: Record<Exclude<OpeningCommand, "submit" | "auto_close">, { from: OpeningStatus[]; to: OpeningStatus; action: string }> = {
    approve: { from: ["pending_review"], to: "published", action: "opening_approved" },
    request_changes: { from: ["pending_review"], to: "changes_requested", action: "opening_changes_requested" },
    reject: { from: ["pending_review"], to: "rejected", action: "opening_rejected" },
    pause: { from: ["published"], to: "paused", action: "opening_paused" },
    resume: { from: ["paused"], to: "published", action: "opening_resumed" },
    close: { from: ["published", "paused"], to: "closed", action: "opening_closed" },
    suspend: { from: ["draft", "pending_review", "changes_requested", "published", "paused", "suspended"], to: "suspended", action: "opening_suspended" },
    restore_to_draft: { from: ["suspended"], to: "draft", action: "opening_restored" },
    cancel: { from: ["draft", "pending_review", "changes_requested", "published", "paused", "suspended"], to: "cancelled", action: "opening_cancelled" },
  };
  const rule = map[input.command];
  if (!rule || !rule.from.includes(input.status) || terminal.has(input.status) || (input.command === "suspend" && input.status === "suspended")) throw new AppError("INVALID_TRANSITION");
  if (["approve", "resume"].includes(input.command) && (!input.complete || !input.companyActive || isOpeningExpired(input.closingDate, input.now))) throw new AppError("INVALID_TRANSITION");
  return { nextStatus: rule.to, auditAction: rule.action, cancelOpenParticipations: input.command === "cancel" };
}
