import "server-only";
import { readAccountSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/public-error";
import { workflowRpcError } from "@/lib/errors/workflow-rpc";
import { notificationReference, notificationSchema, notificationsSchema, notificationTarget, notificationsHref, preinterviewAgendaSchema } from "./contracts";

async function activeSession() {
  const session = await readAccountSession();
  if (!session) throw new AppError("AUTH_REQUIRED");
  if (session.account.status !== "active") throw new AppError("ACCESS_DENIED");
  return session;
}
export async function listNotifications(page = 1, size = 20) {
  const session = await activeSession();
  if (!Number.isInteger(page) || page < 1 || page > 10000 || !Number.isInteger(size) || size < 1 || size > 20) throw new AppError("VALIDATION_ERROR");
  const result = await session.client.rpc("list_my_notifications", { p_page: page, p_page_size: size });
  if (result.error) throw workflowRpcError(result.error.message);
  const parsed = notificationsSchema.safeParse(result.data);
  if (!parsed.success || parsed.data.page !== page || parsed.data.pageSize !== size
    || parsed.data.items.some(item => item.available && !notificationTarget(item, session.account.role))) throw new AppError("INTERNAL_ERROR");
  return { ...parsed.data, listHref: notificationsHref(session.account.role) };
}
export async function openNotification(reference: unknown) {
  const session = await activeSession();
  const parsed = notificationReference.safeParse(reference);
  if (!parsed.success) throw new AppError("NOT_FOUND");
  const result = await session.client.rpc("open_my_notification", { p_reference: parsed.data });
  if (result.error) throw workflowRpcError(result.error.message);
  const item = notificationSchema.safeParse(result.data);
  if (!item.success) throw new AppError("INTERNAL_ERROR");
  const href = notificationTarget(item.data, session.account.role);
  if (item.data.available && !href) throw new AppError("INTERNAL_ERROR");
  return href ?? `${notificationsHref(session.account.role)}${session.account.role === "candidate" ? "&" : "?"}unavailable=1`;
}
export async function candidatePreinterviewAgenda() {
  const session = await activeSession();
  if (session.account.role !== "candidate") throw new AppError("ACCESS_DENIED");
  const result = await session.client.rpc("my_candidate_preinterview_agenda");
  if (result.error) throw workflowRpcError(result.error.message);
  const parsed = preinterviewAgendaSchema.safeParse(result.data);
  if (!parsed.success) throw new AppError("INTERNAL_ERROR");
  return parsed.data;
}
