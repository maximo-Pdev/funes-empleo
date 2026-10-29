import { z } from "zod";
import { preinterviewChannelSchema } from "@/domain/catalogs";
import { contactChannelLabels } from "@/domain/presentation/labels";

export const notificationLabels = {
  candidate_nominated: "La Oficina te incorporó a una oferta",
  candidate_preinterview: "La Oficina registró una preentrevista",
  candidate_referred: "La Oficina te derivó a una empresa",
  candidate_hired: "La Oficina confirmó tu contratación",
  candidate_not_selected: "La Oficina confirmó que no fuiste seleccionado",
  company_referral: "Recibiste una nueva derivación",
  company_published: "La Oficina aprobó y publicó tu oferta",
  company_rejected: "La Oficina rechazó tu oferta",
  admin_review: "Hay una oferta pendiente de revisión",
  admin_application: "Se recibió una nueva postulación",
  admin_hired_report: "Una empresa informó una contratación: revisar resultado",
  admin_not_selected_report: "Una empresa informó una no selección: revisar resultado",
  admin_company_registered: "Se registró una empresa: revisar su perfil",
} as const;

export const notificationReference = z.string().regex(/^aviso-[0-9a-f]{24}$/);
const reference = (prefix: string) => z.string().regex(new RegExp(`^${prefix}-[0-9a-f]{24}$`));
const targetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("candidate_participation"), reference: reference("cas") }).strict(),
  z.object({ kind: z.literal("admin_participation"), reference: reference("cas") }).strict(),
  z.object({ kind: z.literal("admin_opening"), reference: reference("ofe") }).strict(),
  z.object({ kind: z.literal("admin_company"), reference: reference("emp") }).strict(),
  z.object({ kind: z.literal("company_opening"), reference: reference("ofe") }).strict(),
  z.object({ kind: z.literal("company_referral"), reference: reference("ofe"), referral: reference("der") }).strict(),
]);
export const notificationSchema = z.object({
  reference: notificationReference,
  kind: z.enum(Object.keys(notificationLabels) as [keyof typeof notificationLabels, ...(keyof typeof notificationLabels)[]]),
  createdAt: z.iso.datetime({ offset: true }), readAt: z.iso.datetime({ offset: true }).nullable(),
  available: z.boolean(), subject: z.string().max(500).nullable(), target: targetSchema.nullable(),
}).strict().refine(item => item.available === (item.target !== null) && (item.available || item.subject === null));
export const notificationsSchema = z.object({
  total: z.number().int().nonnegative(), unread: z.number().int().nonnegative(),
  page: z.number().int().min(1).max(10000), pageSize: z.number().int().min(1).max(20),
  items: z.array(notificationSchema).max(20),
}).strict();
export type Notification = z.infer<typeof notificationSchema>;
export type Notifications = z.infer<typeof notificationsSchema>;
export type NotificationRole = "admin" | "candidate" | "company";
export function notificationsHref(role: NotificationRole) {
  return role === "admin" ? "/admin/notificaciones" : role === "company" ? "/empresa/notificaciones" : "/dashboard?section=notificaciones";
}
export function notificationTarget(item: Notification, role: NotificationRole): string | null {
  const target = item.target;
  if (!item.available || !target || !item.kind.startsWith(`${role}_`) || !target.kind.startsWith(`${role}_`)) return null;
  switch (target.kind) {
    case "candidate_participation": return `/dashboard?section=postulaciones#${target.reference}`;
    case "admin_participation": return `/admin/participations/${target.reference}`;
    case "admin_opening": return `/admin/openings/${target.reference}`;
    case "admin_company": return `/admin/empresas/${target.reference}`;
    case "company_opening": return `/empresa/ofertas/${target.reference}`;
    case "company_referral": return `/empresa/ofertas/${target.reference}?referral=${target.referral}#derivaciones`;
  }
}
export const preinterviewAgendaSchema = z.array(z.object({
  reference: reference("cas"), scheduledAt: z.iso.datetime({ offset: true }).nullable(),
  heldAt: z.iso.datetime({ offset: true }).nullable(),
  channel: preinterviewChannelSchema,
}).strict());
export const preinterviewChannelLabels = contactChannelLabels;
