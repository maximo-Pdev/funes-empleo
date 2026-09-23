"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError, publicErrorFrom } from "@/lib/errors/public-error";
import { confirmReportedOutcome, submitCompanyFeedback, submitCompanyInterview } from "./feedback-service";

export type ReferralActionState = { status: "idle" | "success" | "error"; message: string };
export const initialReferralActionState: ReferralActionState = { status: "idle", message: "" };

function failure(error: unknown): ReferralActionState {
  return { status: "error", message: publicErrorFrom(error).message };
}

function funesLocalToIso(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new AppError("VALIDATION_ERROR");
  const naive = Date.parse(`${value}:00Z`);
  if (Number.isNaN(naive)) throw new AppError("VALIDATION_ERROR");
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Buenos_Aires", hourCycle: "h23", year: "numeric",
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const local = (utc: number) => {
    const parts = formatter.formatToParts(new Date(utc));
    const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
    return `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}`;
  };
  let utc = naive + 3 * 60 * 60 * 1000;
  for (let i = 0; i < 3; i++) {
    const rendered = local(utc);
    if (rendered === value) return new Date(utc).toISOString();
    utc += naive - Date.parse(`${rendered}:00Z`);
  }
  throw new AppError("VALIDATION_ERROR");
}

export async function submitFeedbackAction(_previous: ReferralActionState, form: FormData): Promise<ReferralActionState> {
  try {
    const openingId = String(form.get("openingId") ?? "");
    if (!z.uuid().safeParse(openingId).success) throw new AppError("VALIDATION_ERROR");
    await submitCompanyFeedback({
      referralId: form.get("referralId"),
      reportedOutcome: form.get("reportedOutcome"), message: form.get("message") ?? "",
    });
    revalidatePath(`/company/openings/${openingId}/referrals`);
    return { status: "success", message: "El resultado informado quedó pendiente de revisión municipal." };
  } catch (error) { return failure(error); }
}

export async function submitInterviewAction(_previous: ReferralActionState, form: FormData): Promise<ReferralActionState> {
  try {
    const openingId = String(form.get("openingId") ?? "");
    if (!z.uuid().safeParse(openingId).success) throw new AppError("VALIDATION_ERROR");
    await submitCompanyInterview({
      referralId: form.get("referralId"), expectedVersion: form.get("expectedVersion"),
      status: form.get("status"), scheduledAt: funesLocalToIso(form.get("scheduledAt")),
      heldAt: funesLocalToIso(form.get("heldAt")), message: form.get("message") ?? "",
    });
    revalidatePath(`/company/openings/${openingId}/referrals`);
    return { status: "success", message: "La entrevista quedó registrada." };
  } catch (error) { return failure(error); }
}

export async function confirmOutcomeAction(_previous: ReferralActionState, form: FormData): Promise<ReferralActionState> {
  try {
    await confirmReportedOutcome({
      participationId: form.get("participationId"), expectedVersion: form.get("expectedVersion"),
      outcome: form.get("outcome"), lateCorrection: form.get("lateCorrection") === "true",
      reason: form.get("reason") || undefined, feedbackId: form.get("feedbackId") || undefined,
      contactId: form.get("contactId") || undefined,
    });
    return { status: "success", message: "El resultado quedó confirmado por la Oficina." };
  } catch (error) { return failure(error); }
}
