import sharp from "sharp";
import heicConvert from "heic-convert";

export async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  const result = await heicConvert({
    buffer: buffer as unknown as ArrayBufferLike,
    format: "JPEG",
    quality: 0.9,
  });
  return Buffer.from(result as ArrayBuffer);
}

export async function convertToWebp(buffer: Buffer) {
  return sharp(buffer).webp({ quality: 82 }).toBuffer();
}

export async function createThumbnail(buffer: Buffer) {
  return sharp(buffer)
    .resize(300, 300, { fit: "inside" })
    .webp({ quality: 80 })
    .toBuffer();
}
