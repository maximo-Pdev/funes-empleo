// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { rpc, upload, remove, normalize } = vi.hoisted(() => ({ rpc: vi.fn(), upload: vi.fn(), remove: vi.fn(), normalize: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ rpc, storage: { from: () => ({ upload, remove }) } }) }));
vi.mock('@/lib/env/client', () => ({ getClientEnvironment: () => ({ NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid' }) }));
vi.mock('@/lib/env/server', () => ({ getServerEnvironment: () => ({ SUPABASE_SECRET_KEY: 'test-not-a-secret' }) }));
vi.mock('@/lib/files/image-validation', () => ({ normalizeCandidatePhoto: normalize, MAX_PHOTO_BYTES: 5242880 }));
import { persistCandidatePhoto } from '@/features/candidates/photo-storage';
const input = { actor: 'actor', authUser: 'user', sessionId: 'ee700000-0000-4000-8000-000000000001', candidateId: 'candidate', version: 2, command: 'upload' as const, photo: new File(['x'], 'private-name.png') };
beforeEach(() => {
  vi.clearAllMocks(); normalize.mockResolvedValue({ bytes: Buffer.from('webp'), size: 4, sha256: 'a'.repeat(64) });
  upload.mockResolvedValue({ error: null }); remove.mockResolvedValue({ error: null });
  rpc.mockImplementation(async (name: string, args: { p_command?: string }) => ({ data: name === 'candidate_photo_cleanup' ? [] : args.p_command === 'prepare' ? 'new' : 3, error: null }));
});
it('uploads only normalized bytes to a new immutable WebP key before committing', async () => {
  expect((await persistCandidatePhoto(input)).status).toBe('ok');
  expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^candidate\/[0-9a-f-]+\.webp$/), Buffer.from('webp'), { contentType: 'image/webp', upsert: false, cacheControl: '0' });
  expect(rpc.mock.calls.filter(([name]) => name === 'ingest_candidate_photo').map(([, args]) => args.p_command)).toEqual(['prepare', 'commit']);
});
it('invalid decoded bytes do not reserve or modify the old current', async () => {
  normalize.mockRejectedValue(new Error('INVALID_PHOTO'));
  expect((await persistCandidatePhoto(input)).status).toBe('invalid');
  expect(rpc).not.toHaveBeenCalled(); expect(upload).not.toHaveBeenCalled(); expect(remove).not.toHaveBeenCalled();
});
it('never deletes the previous current blob to make room when upload fails', async () => {
  upload.mockResolvedValue({ error: { message: 'quota' } });
  expect((await persistCandidatePhoto(input)).status).toBe('error');
  expect(rpc.mock.calls.some(([, args]) => args.p_command === 'commit')).toBe(false);
  expect(rpc.mock.calls.some(([, args]) => args.p_command === 'abort')).toBe(true);
});
it('reports committed physical cleanup failure and retains retry queue', async () => {
  rpc.mockImplementation(async (name: string) => ({ data: name === 'candidate_photo_cleanup' ? [{ id: 'old', storage_path: 'candidate/old.webp' }] : 3, error: null }));
  remove.mockResolvedValue({ error: { message: 'unavailable' } });
  expect((await persistCandidatePhoto({ ...input, command: 'remove', photo: undefined })).status).toBe('cleanup_pending');
  expect(rpc.mock.calls.some(([name]) => name === 'complete_candidate_photo_cleanup')).toBe(false);
});
it('retries physical deletion on remove even when current is already absent', async () => {
  rpc.mockImplementation(async (name: string) => ({ data: name === 'candidate_photo_cleanup' ? [{ id: 'old', storage_path: 'candidate/old.webp' }] : 3, error: null }));
  expect((await persistCandidatePhoto({ ...input, command: 'remove', photo: undefined })).status).toBe('ok');
  expect(remove).toHaveBeenCalledWith(['candidate/old.webp']);
  expect(rpc.mock.calls.some(([name]) => name === 'complete_candidate_photo_cleanup')).toBe(true);
});
it('returns conflict on commit race and aborts only staged new photo', async () => {
  rpc.mockImplementation(async (name: string, args: { p_command?: string }) => args.p_command === 'commit' ? { error: { message: 'CONFLICT_STALE_DATA' } } : { data: name === 'candidate_photo_cleanup' ? [] : null, error: null });
  expect((await persistCandidatePhoto(input)).status).toBe('conflict');
  expect(rpc.mock.calls.some(([, args]) => args.p_command === 'abort')).toBe(true);
});
