import { z } from "zod";
import { readAccountSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
};

function denied(status: number) {
  return new Response("No encontramos el CV solicitado o no tenés acceso a él.", {
    status, headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET(_request: Request, context: { params: Promise<{ cvId: string }> }) {
  const { cvId } = await context.params;
  if (!z.uuid().safeParse(cvId).success) return denied(404);
  const session = await readAccountSession();
  if (!session || session.account.status !== "active") return denied(401);

  // Both the RPC and Storage RLS recompute the active ownership/referral permission
  // for this request. No signed URL or storage path is sent to the browser.
  const authorized = await session.client.rpc("authorized_cv_path", { p_cv: cvId });
  if (authorized.error || !authorized.data) return denied(404);
  const download = await session.client.storage.from("candidate-cvs").download(authorized.data);
  if (download.error || !download.data) return denied(404);

  // A copy already downloaded by a third party cannot be technically revoked.
  return new Response(download.data.stream(), {
    status: 200,
    headers: {
      ...headers,
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="cv.pdf"',
      "Content-Length": String(download.data.size),
    },
  });
}
