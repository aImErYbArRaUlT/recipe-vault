import sharp from "sharp";
import { convertToWebp, createThumbnail } from "@/lib/images";

async function buildSampleImage() {
  return sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: "#ffffff",
    },
  })
    .png()
    .toBuffer();
}

describe("image processing", () => {
  it("converts to webp", async () => {
    const buffer = await buildSampleImage();
    const output = await convertToWebp(buffer);
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe("webp");
  });

  it("creates a 300px thumbnail", async () => {
    const buffer = await buildSampleImage();
    const output = await createThumbnail(buffer);
    const metadata = await sharp(output).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.width ?? 0).toBeLessThanOrEqual(300);
    expect(metadata.height ?? 0).toBeLessThanOrEqual(300);
  });
});
