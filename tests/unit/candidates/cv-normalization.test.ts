// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { crc32 } from "node:zlib";
import { randomFillSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { normalizeCv } from "@/lib/files/cv-normalization";
import { validatePdf } from "@/lib/files/pdf-validation";
import { MAX_CV_BYTES } from "@/lib/files/cv-policy";

const pdf = new Uint8Array(readFileSync(join(process.cwd(), "tests/fixtures/cv-fictitious.pdf")));
const image = () => sharp({ create: { width: 600, height: 900, channels: 3, background: "#ffffff" } });
describe("CV: PDF e imágenes controladas", () => {
  it("preserva bytes y huella de PDF válido, con límite inclusivo5 MiB", async () => {
    const result = await normalizeCv("cv-ficticio.pdf", "application/pdf", pdf);
    expect(result?.bytes).toEqual(pdf);
    expect(result?.sha256).toBe(validatePdf("cv-ficticio.pdf", "application/pdf", pdf)?.sha256);
    const full = new Uint8Array(MAX_CV_BYTES).fill(32); full.set(pdf);
    expect((await normalizeCv("cv.pdf", "application/pdf", full))?.size).toBe(MAX_CV_BYTES);
    expect(await normalizeCv("cv.pdf", "application/pdf", new Uint8Array(MAX_CV_BYTES + 1))).toBeNull();
  });
  it.each(["jpg", "jpeg", "png"])("convierte %s real a PDF válido con nombre seguro", async extension => {
    const raster = extension === "png" ? await image().png().toBuffer() : await image().jpeg().toBuffer();
    const result = await normalizeCv(`currículum ficticio.${extension}`, extension === "png" ? "image/png" : "image/jpeg", raster);
    expect(result).not.toBeNull();
    expect(result!.safeName).toBe("currículum ficticio.pdf");
    expect(result!.size).toBeLessThanOrEqual(MAX_CV_BYTES);
    expect(validatePdf(result!.safeName, "application/pdf", result!.bytes)).not.toBeNull();
  });
  it.each([
    ["cv.webp", "image/webp"], ["cv.gif", "image/gif"], ["cv.svg", "image/svg+xml"],
    ["cv.mp4", "video/mp4"], ["cv.jpg", "image/png"], ["cv.png", "image/jpeg"], ["cv.jpg", ""],
  ])("rechaza formato/MIME no permitido: %s %s", async (name, mime) => {
    expect(await normalizeCv(name!, mime!, await image().png().toBuffer())).toBeNull();
  });
  it("rechaza WebP real, PDF disfrazado, imágenes dañadas y expansión excesiva", async () => {
    expect(await normalizeCv("cv.webp", "image/webp", await image().webp().toBuffer())).toBeNull();
    expect(await normalizeCv("cv.jpg", "image/jpeg", pdf)).toBeNull();
    expect(await normalizeCv("cv.png", "image/png", new Uint8Array([137,80,78,71,13,10,26,10]))).toBeNull();
    const huge = await sharp({ create: { width: 5000, height: 4000, channels: 3, background: "#fff" } }).png().toBuffer();
    expect(await normalizeCv("cv.png", "image/png", huge)).toBeNull();
    expect(await normalizeCv("cv.pdf", "application/pdf", new Uint8Array())).toBeNull();
  });
  it("rechaza PNG animado aunque tenga una imagen predeterminada estática", async () => {
    const png = await image().png().toBuffer();
    const payload = Buffer.alloc(12); payload.write("acTL"); payload.writeUInt32BE(2, 4);
    const chunk = Buffer.alloc(20); chunk.writeUInt32BE(8); payload.copy(chunk, 4); chunk.writeUInt32BE(crc32(payload), 16);
    expect(await normalizeCv("cv.png", "image/png", Buffer.concat([png.subarray(0, 33), chunk, png.subarray(33)]))).toBeNull();
  });
  it("rechaza una imagen admitida si el PDF resultante excede5 MiB", async () => {
    const raster=randomFillSync(Buffer.alloc(4000*4000*3));
    const jpeg=await sharp(raster,{raw:{width:4000,height:4000,channels:3}}).jpeg({quality:15}).toBuffer();
    expect(jpeg.length).toBeLessThan(MAX_CV_BYTES);
    expect(await normalizeCv("cv.jpg","image/jpeg",jpeg)).toBeNull();
  });
});
