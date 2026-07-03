// Generate native app icon + splash PNG sources from the brand mark.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PAPER = "#f7f2ea";
const ACCENT_DEEP = "#9a4225";

// 1024x1024 icon SVG: stacked recipe cards on the brand cream background.
function iconSvg(size = 1024): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${size}" height="${size}">
  <rect width="1024" height="1024" fill="${PAPER}"/>
  <g transform="translate(512 512) scale(34) translate(-12 -12)"
     fill="none" stroke="${ACCENT_DEEP}" stroke-width="1.6"
     stroke-linecap="round" stroke-linejoin="round">
    <rect x="3.6" y="6.4" width="13" height="14" rx="2"
          transform="rotate(-8 10.1 13.4)" opacity="0.45"/>
    <rect x="6" y="4.6" width="13" height="14" rx="2"
          transform="rotate(5 12.5 11.6)" opacity="0.7"/>
    <rect x="6.4" y="5.2" width="13.2" height="14.4" rx="2.2"
          fill="${ACCENT_DEEP}" fill-opacity="0.08"/>
    <rect x="6.4" y="5.2" width="13.2" height="14.4" rx="2.2"/>
    <path d="M9.4 9.6h7"/>
    <path d="M9.4 12.6h7" opacity="0.55"/>
    <path d="M9.4 15.2h4.6" opacity="0.55"/>
  </g>
</svg>`;
}

// 2732x2732 splash SVG: same mark, smaller relative to canvas for Capacitor's center crop.
function splashSvg(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732" width="2732" height="2732">
  <rect width="2732" height="2732" fill="${PAPER}"/>
  <g transform="translate(1366 1366) scale(28) translate(-12 -12)"
     fill="none" stroke="${ACCENT_DEEP}" stroke-width="1.6"
     stroke-linecap="round" stroke-linejoin="round">
    <rect x="3.6" y="6.4" width="13" height="14" rx="2"
          transform="rotate(-8 10.1 13.4)" opacity="0.45"/>
    <rect x="6" y="4.6" width="13" height="14" rx="2"
          transform="rotate(5 12.5 11.6)" opacity="0.7"/>
    <rect x="6.4" y="5.2" width="13.2" height="14.4" rx="2.2"
          fill="${ACCENT_DEEP}" fill-opacity="0.08"/>
    <rect x="6.4" y="5.2" width="13.2" height="14.4" rx="2.2"/>
    <path d="M9.4 9.6h7"/>
    <path d="M9.4 12.6h7" opacity="0.55"/>
    <path d="M9.4 15.2h4.6" opacity="0.55"/>
  </g>
</svg>`;
}

async function main() {
  const outDir = path.resolve(process.cwd(), "assets");
  await mkdir(outDir, { recursive: true });

  // Icon
  const iconPng = await sharp(Buffer.from(iconSvg())).png().toBuffer();
  await writeFile(path.join(outDir, "icon.png"), iconPng);

  // Splash (both light + dark go to the same paper background per brand)
  const splashPng = await sharp(Buffer.from(splashSvg())).png().toBuffer();
  await writeFile(path.join(outDir, "splash.png"), splashPng);
  await writeFile(path.join(outDir, "splash-dark.png"), splashPng);

  console.log("[build-app-assets] Wrote assets/icon.png, assets/splash.png, assets/splash-dark.png");
  console.log("[build-app-assets] Next: npm run cap:assets");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
