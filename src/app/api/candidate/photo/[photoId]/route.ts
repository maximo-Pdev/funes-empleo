import { readAccountSession } from "@/lib/auth/session";
export const runtime = 'nodejs';
const privacy = { 'Cache-Control': 'private, no-store', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' };
export async function GET(_request: Request, context: { params: Promise<{ photoId: string }> }) {
  const denied = () => Response.json({ status: 'denied', message: 'La foto no está disponible o no tenés permiso para verla.' }, { status: 403, headers: privacy });
  try {
    const { photoId } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photoId)) return denied();
    const session = await readAccountSession();
    if (!session || session.account.status !== 'active') return denied();
    const photo = await session.client.from('candidate_photos').select('storage_path').eq('id', photoId).eq('state', 'current').maybeSingle();
    if (photo.error || !photo.data) return denied();
    // No elevated reader: Storage RLS repeats live authorization after metadata lookup.
    const image = await session.client.storage.from('candidate-photos').download(photo.data.storage_path);
    if (image.error || !image.data) return denied();
    return new Response(image.data.stream(), { status: 200, headers: { ...privacy, 'Content-Type': 'image/webp', 'Content-Disposition': 'inline; filename="foto.webp"' } });
  } catch { return denied(); }
}
