// @vitest-environment node
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import sharp from "sharp";
import { crc32 } from 'node:zlib';
import { normalizeCandidatePhoto } from "@/lib/files/image-validation";

it("decodes JPEG bytes independently of the declared MIME and emits bounded metadata-free WebP", async () => {
  const input = await sharp({ create: { width: 1500, height: 800, channels: 3, background: "red" } }).jpeg().withMetadata().toBuffer();
  const result = await normalizeCandidatePhoto(input);
  const meta = await sharp(result.bytes).metadata();
  expect(meta.format).toBe("webp"); expect(meta.width).toBe(1024);
  expect(meta.exif).toBeUndefined(); expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
});
it.each([Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), Buffer.from('not an image'), Buffer.alloc(0), Buffer.alloc(5 * 1024 * 1024 + 1)])("rejects invalid, SVG, empty and oversize bytes", async bytes => {
  await expect(normalizeCandidatePhoto(bytes)).rejects.toThrow("INVALID_PHOTO");
});
it("rejects a decoded raster over 16 megapixels", async () => {
  const bytes = await sharp({ create: { width: 4001, height: 4000, channels: 3, background: 'white' } }).png().toBuffer();
  await expect(normalizeCandidatePhoto(bytes)).rejects.toThrow("INVALID_PHOTO");
});
it("accepts PNG and does not enlarge a small image", async () => {
  const bytes = await sharp({ create: { width: 20, height: 10, channels: 4, background: 'white' } }).png().toBuffer();
  const normalized = await normalizeCandidatePhoto(bytes);
  expect((await sharp(normalized.bytes).metadata()).width).toBe(20);
});
it('rejects APNG animation control even when the decoder exposes a single default frame', async () => {
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).png().toBuffer();
  const payload = Buffer.alloc(12); payload.write('acTL'); payload.writeUInt32BE(2, 4);
  const chunk = Buffer.alloc(20); chunk.writeUInt32BE(8); payload.copy(chunk, 4); chunk.writeUInt32BE(crc32(payload), 16);
  const animatedPng = Buffer.concat([png.subarray(0, 33), chunk, png.subarray(33)]);
  await expect(normalizeCandidatePhoto(animatedPng)).rejects.toThrow('INVALID_PHOTO');
});
it("rejects multi-frame input", async () => {
  const bytes = await sharp({ create: { width: 2, height: 4, channels: 3, background: 'red', pageHeight: 2 } }).gif().toBuffer();
  await expect(normalizeCandidatePhoto(bytes)).rejects.toThrow("INVALID_PHOTO");
});
