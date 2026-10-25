// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/features/candidates/photo-service', () => ({ changeCandidatePhoto: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ readAccountSession: vi.fn() }));
import { changeCandidatePhoto } from '@/features/candidates/photo-service';
import { readAccountSession } from '@/lib/auth/session';
import { POST } from '@/app/api/candidate/photo/route';
import { GET } from '@/app/api/candidate/photo/[photoId]/route';
const id = '0a000000-0000-4000-8000-000000000001';
const download = vi.fn(); const maybeSingle = vi.fn();
const query = { select: vi.fn(), eq: vi.fn(), maybeSingle };
function request(version='2', command='remove') {
 const form = new FormData(); form.set('candidateId', id); form.set('version', version); form.set('command', command);
 return new Request('http://localhost/api/candidate/photo', { method: 'POST', body: form });
}
beforeEach(() => {
 vi.clearAllMocks(); query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
 vi.mocked(changeCandidatePhoto).mockResolvedValue({ status: 'ok', message: 'Guardado.' });
 vi.mocked(readAccountSession).mockResolvedValue({ account: { status: 'active' }, client: { from: () => query, storage: { from: () => ({ download }) } } } as never);
 maybeSingle.mockResolvedValue({ data: { storage_path: `${id}/${id}.webp` }, error: null });
 download.mockResolvedValue({ data: new Blob(['webp']), error: null });
});
it.each([['ok',200],['invalid',422],['conflict',409],['denied',403],['error',500],['cleanup_pending',503]] as const)('maps %s to %d with Spanish message', async (status, expected) => {
 vi.mocked(changeCandidatePhoto).mockResolvedValue({ status, message: 'Mensaje seguro.' });
 const response = await POST(request()); expect(response.status).toBe(expected);
 expect(await response.json()).toEqual({ status, message: 'Mensaje seguro.' });
 expect(response.headers.get('cache-control')).toBe('private, no-store');
});
it.each(['0','-1','2.1','2x','1e2','2147483648'])('rejects malformed version %s before mutation', async version => {
 expect((await POST(request(version))).status).toBe(422); expect(changeCandidatePhoto).not.toHaveBeenCalled();
});
it('rejects missing file for upload', async () => {
 expect((await POST(request('2','upload'))).status).toBe(422); expect(changeCandidatePhoto).not.toHaveBeenCalled();
});
it('denies a cross-origin form without touching session or storage', async () => {
 const req = request(); req.headers.set('origin','https://attacker.invalid');
 expect((await POST(req)).status).toBe(403); expect(changeCandidatePhoto).not.toHaveBeenCalled();
});
it.each([
 ['http://localhost:3107/api/candidate/photo', 'localhost:3107', 'http://localhost:3107'],
 ['https://example.test/api/candidate/photo', 'example.test', 'https://example.test'],
 ['http://localhost:3107/api/candidate/photo', '127.0.0.1:3107', 'http://127.0.0.1:3107'],
 ['http://localhost:3107/api/candidate/photo', '[::1]:3107', 'http://[::1]:3107'],
 ['https://localhost/api/candidate/photo', 'EXAMPLE.test:443', 'https://example.test'],
])('accepts actual Host origin despite internal Next URL %s / %s', async (url, host, origin) => {
 // Keep the multipart boundary paired with its own body.
 const original = request();
 const actual = new Request(url, { method: 'POST', body: await original.arrayBuffer(), headers: original.headers });
 actual.headers.set('host', host); actual.headers.set('origin', origin);
 expect((await POST(actual)).status).toBe(200);
 expect(changeCandidatePhoto).toHaveBeenCalled();
});
it.each(['https://attacker.invalid', 'null', 'http://127.0.0.1:3107/path', 'http://127.0.0.1:3107, https://attacker.invalid'])('denies malformed/foreign Origin %s even with matching forwarded headers', async origin => {
 const req = request(); req.headers.set('host', '127.0.0.1:3107'); req.headers.set('origin', origin);
 req.headers.set('x-forwarded-host', 'attacker.invalid'); req.headers.set('x-forwarded-proto', 'https');
 req.headers.set('forwarded', 'host=attacker.invalid;proto=https');
 expect((await POST(req)).status).toBe(403); expect(changeCandidatePhoto).not.toHaveBeenCalled();
});
it.each(['attacker.invalid@127.0.0.1:3107', '127.0.0.1:3107/path', '127.0.0.1:3107, attacker.invalid', ''])('fails closed on malformed Host %s', async host => {
 const req = request(); req.headers.set('host', host); req.headers.set('origin', 'http://127.0.0.1:3107');
 expect((await POST(req)).status).toBe(403); expect(changeCandidatePhoto).not.toHaveBeenCalled();
});
it('bounds chunked multipart bodies even without Content-Length', async () => {
 const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new Uint8Array(5 * 1024 * 1024 + 65537)); controller.close(); } });
 const req = new Request('http://localhost/api/candidate/photo', { method: 'POST', headers: { 'content-type': 'multipart/form-data; boundary=x' }, body, duplex: 'half' } as RequestInit);
 const parse = vi.spyOn(req, 'formData');
 expect((await POST(req)).status).toBe(422);
 expect(parse).not.toHaveBeenCalled(); expect(changeCandidatePhoto).not.toHaveBeenCalled();
});
it('streams only current RLS-authorized photo with privacy headers', async () => {
 const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ photoId: id }) });
 expect(response.status).toBe(200); expect(await response.text()).toBe('webp');
 expect(query.eq).toHaveBeenCalledWith('state','current');
 expect(response.headers.get('content-type')).toBe('image/webp');
 expect(response.headers.get('x-content-type-options')).toBe('nosniff');
 expect(response.headers.get('cache-control')).toBe('private, no-store');
 expect(response.headers.get('vary')).toBe('Cookie');
});
it('does not download superseded, removed or unauthorized photos', async () => {
 maybeSingle.mockResolvedValue({ data: null, error: null });
 expect((await GET(new Request('http://localhost'), { params: Promise.resolve({ photoId: id }) })).status).toBe(403);
 expect(download).not.toHaveBeenCalled();
});
it('rechecks live storage authorization and never falls back to service-role reads', async () => {
 download.mockResolvedValue({ error: { message: 'permission revoked' } });
 expect((await GET(new Request('http://localhost'), { params: Promise.resolve({ photoId: id }) })).status).toBe(403);
});
