import { listNotifications } from "@/features/notifications/service";
import { notificationHttpError, notificationHeaders } from "@/features/notifications/http";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    if ([...params.keys()].some(key => !["page", "size"].includes(key)) || params.getAll("page").length > 1 || params.getAll("size").length > 1) {
      return Response.json({ message: "Revisá los filtros de notificaciones." }, { status: 422, headers: notificationHeaders });
    }
    const data = await listNotifications(params.has("page") ? Number(params.get("page")) : 1, params.has("size") ? Number(params.get("size")) : 5);
    return Response.json(data, { headers: notificationHeaders });
  } catch (error) { return notificationHttpError(error); }
}
