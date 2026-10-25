import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export async function normalizeCandidatePhoto(input: Uint8Array) {
  if (!input.byteLength || input.byteLength > MAX_PHOTO_BYTES) throw new Error("INVALID_PHOTO");
  // Do not invoke unrelated decoders (notably SVG) on untrusted inputs.
  const signature = Buffer.from(input.subarray(0, 8));
  const jpeg = signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
  const pngSignature = signature.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!jpeg && !pngSignature) throw new Error('INVALID_PHOTO');
  try {
    const image = sharp(input, { limitInputPixels: 16_000_000, animated: true, failOn: "warning" });
    const metadata = await image.metadata();
    if (metadata.format === 'png') {
      // libvips may expose only an APNG default frame; reject animation control explicitly.
      const png = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
      for (let offset = 8; offset + 12 <= png.length;) {
        const length = png.readUInt32BE(offset);
        if (length > png.length - offset - 12) throw new Error('INVALID_PHOTO');
        if (png.toString('ascii', offset + 4, offset + 8) === 'acTL') throw new Error('INVALID_PHOTO');
        offset += length + 12;
      }
    }
    if (!['jpeg', 'png'].includes(metadata.format ?? '') || (metadata.pages ?? 1) !== 1
      || !metadata.width || !metadata.height || metadata.width * metadata.height > 16_000_000) {
      throw new Error("INVALID_PHOTO");
    }
    // No keepMetadata/withMetadata: the re-encoded output contains no source EXIF.
    const bytes = await image.rotate().resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 }).toBuffer();
    return { bytes, size: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
  } catch { throw new Error("INVALID_PHOTO"); }
}
