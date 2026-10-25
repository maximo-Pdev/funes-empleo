// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ readAccountSession: vi.fn() }));
vi.mock("@/features/candidates/photo-storage", async importOriginal => ({ ...await importOriginal<typeof import('@/features/candidates/photo-storage')>(), persistCandidatePhoto: vi.fn() }));
import { readAccountSession } from "@/lib/auth/session";
import { persistCandidatePhoto } from "@/features/candidates/photo-storage";
import { changeCandidatePhoto, getCandidatePhoto, getPhotoCleanupPending } from "@/features/candidates/photo-service";
const candidateId = '0a000000-0000-4000-8000-000000000001';
const rpc = vi.fn(); const maybeSingle = vi.fn();
const query = { select: vi.fn(), eq: vi.fn(), maybeSingle };
const session = { account: { id: 'actor', role: 'candidate', status: 'active' }, user: { id: 'auth-user' }, client: { rpc, from: () => query } };
beforeEach(() => {
  vi.clearAllMocks(); query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
  vi.mocked(readAccountSession).mockResolvedValue(session as never);
  rpc.mockResolvedValue({ data: "ee700000-0000-4000-8000-000000000001", error: null });
  vi.mocked(persistCandidatePhoto).mockResolvedValue({ status: 'ok', message: 'Foto guardada.' });
});
it('denies administrator photo mutation while retaining administrator reads', async () => {
  vi.mocked(readAccountSession).mockResolvedValue({ ...session, account: { ...session.account, role: 'admin' } } as never);
  expect((await changeCandidatePhoto({ candidateId, version: 2, command: 'remove' })).status).toBe('denied');
  expect(persistCandidatePhoto).not.toHaveBeenCalled();
});
it('requires a verified originating session identifier for trusted ingestion', async () => {
  rpc.mockResolvedValue({ data: null, error: null });
  expect((await changeCandidatePhoto({ candidateId, version: 2, command: 'remove' })).status).toBe('denied');
  expect(persistCandidatePhoto).not.toHaveBeenCalled();
});
it('denies anonymous before privileged ingestion', async () => {
  vi.mocked(readAccountSession).mockResolvedValue(null);
  expect((await changeCandidatePhoto({ candidateId, version: 2, command: 'remove' })).status).toBe('denied');
  expect(persistCandidatePhoto).not.toHaveBeenCalled();
});
it('preserves old current on stale authorization and never ingests', async () => {
  rpc.mockResolvedValue({ error: { message: 'CONFLICT_STALE_DATA' } });
  expect((await changeCandidatePhoto({ candidateId, version: 2, command: 'remove' })).status).toBe('conflict');
  expect(persistCandidatePhoto).not.toHaveBeenCalled();
});
it('denies unauthorized profile without privileged storage', async () => {
  rpc.mockResolvedValue({ error: { message: 'NOT_FOUND' } });
  expect((await changeCandidatePhoto({ candidateId, version: 2, command: 'remove' })).status).toBe('denied');
  expect(persistCandidatePhoto).not.toHaveBeenCalled();
});
it('returns committed cleanup failure without claiming physical erasure', async () => {
  vi.mocked(persistCandidatePhoto).mockResolvedValue({ status: 'cleanup_pending', message: 'El cambio se guardó. Queda pendiente borrar el archivo anterior.' });
  expect((await changeCandidatePhoto({ candidateId, version: 2, command: 'remove' })).status).toBe('cleanup_pending');
  expect(persistCandidatePhoto).toHaveBeenCalledWith(expect.objectContaining({ actor: 'actor', authUser: 'auth-user', candidateId, version: 2 }));
});
it('gets only current metadata under the verified session RLS', async () => {
  maybeSingle.mockResolvedValue({ data: { id: 'photo' }, error: null });
  expect(await getCandidatePhoto(candidateId)).toEqual({ id: 'photo' });
  expect(query.eq).toHaveBeenCalledWith('state', 'current');
});
it('retains durable cleanup visibility after refresh with no current photo', async () => {
  rpc.mockResolvedValue({ data: true, error: null });
  expect(await getPhotoCleanupPending(candidateId)).toBe(true);
});
