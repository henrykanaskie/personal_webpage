// ─── Server-only: reads photos from the filesystem at build time ──────────────
// This file must only be imported by server components (no "use client").

import fs from "fs";
import path from "path";
import sizeOf from "image-size";
import sharp from "sharp";
import { SECTION_META, Section, PhotoEntry } from "./data";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"]);

// Module-level cache so the filesystem is only scanned once per server process
const photoCache = new Map<string, PhotoEntry[]>();
let sectionsCache: Section[] | null = null;

/** Snap pixel dimensions to a common CSS aspect-ratio string. */
function snapRatio(w: number, h: number): string {
  const r = w / h;
  if (r >= 1.6) return "16/9";
  if (r >= 1.35) return "3/2";
  if (r >= 1.1) return "4/3";
  if (r >= 0.9) return "1/1";
  if (r >= 0.78) return "4/5";
  if (r >= 0.65) return "2/3";
  return "9/16";
}

/** Deterministic rotation angle based on filename so it's stable across builds. */
function deterministicAngle(filename: string): number {
  let hash = 0;
  for (const ch of filename) hash = ((hash * 31) + ch.charCodeAt(0)) & 0xffff;
  return 130 + (hash % 40); // range: 130–169
}

/** Convert RGB (0–255 each) to HSL { h: 0–360, s: 0–100, l: 0–100 }. */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

async function getPhotosForDir(dirName: string): Promise<PhotoEntry[]> {
  if (photoCache.has(dirName)) return photoCache.get(dirName)!;

  const dir = path.join(process.cwd(), "public", "photography", dirName);
  if (!fs.existsSync(dir)) {
    photoCache.set(dirName, []);
    return [];
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(path.extname(f)))
    .sort((a, b) => {
      // Newest files first — drop a photo in and it appears at the top
      const mtimeA = fs.statSync(path.join(dir, a)).mtimeMs;
      const mtimeB = fs.statSync(path.join(dir, b)).mtimeMs;
      return mtimeB - mtimeA;
    });

  const result = await Promise.all(files.map(async (filename) => {
    const filePath = path.join(dir, filename);
    let ratio = "3/2"; // fallback
    try {
      const buf = fs.readFileSync(filePath);
      const dims = sizeOf(buf);
      if (dims?.width && dims?.height) {
        ratio = snapRatio(dims.width, dims.height);
      }
    } catch {
      // If image-size can't read a file, fall back to default ratio
    }

    let dominantHue: number | undefined;
    let dominantSat: number | undefined;
    let dominantLight: number | undefined;
    try {
      // Resize to 50×50 and sample all pixels.
      // We use a saturation-weighted circular hue average so that small but
      // colorful areas (e.g. Milky Way in an astro shot) dominate over the large
      // black sky. Near-black pixels are skipped for hue/sat but included in the
      // overall lightness average.
      const { data, info } = await sharp(filePath)
        .resize(50, 50, { fit: "cover" })
        .toColorspace("srgb")
        .raw()
        .toBuffer({ resolveWithObject: true });

      const ch = info.channels; // 3 (RGB) or 4 (RGBA)
      const n = info.width * info.height;
      let sinSum = 0, cosSum = 0, satWeightSum = 0;
      let lightSum = 0;
      let colorSatSum = 0, colorPixels = 0;

      for (let i = 0; i < data.length; i += ch) {
        const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const l = (max + min) / 2;
        lightSum += l;
        if (l < 0.05) continue; // skip near-black pixels entirely
        const d = max - min;
        const s = max === min ? 0 : (l > 0.5 ? d / (2 - max - min) : d / (max + min));
        colorSatSum += s;
        colorPixels++;
        if (s < 0.06) continue; // skip near-neutral pixels for hue
        let h = 0;
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else h = ((r - g) / d + 4) / 6;
        const w = s; // weight by saturation so vivid pixels dominate
        sinSum += Math.sin(h * 2 * Math.PI) * w;
        cosSum += Math.cos(h * 2 * Math.PI) * w;
        satWeightSum += w;
      }

      dominantLight = Math.round((lightSum / n) * 100);
      dominantSat = colorPixels > 0 ? Math.round((colorSatSum / colorPixels) * 100) : 0;

      if (satWeightSum > 0.5) {
        // Enough colorful content — use saturation-weighted circular hue average
        const angle = Math.atan2(sinSum / satWeightSum, cosSum / satWeightSum);
        dominantHue = Math.round(((angle / (2 * Math.PI)) * 360 + 360) % 360);
      } else {
        // Mostly neutral — fall back to the 1×1 average hue
        const avg = await sharp(filePath)
          .resize(1, 1, { fit: "cover" }).toColorspace("srgb").raw()
          .toBuffer({ resolveWithObject: true });
        dominantHue = rgbToHsl(avg.data[0], avg.data[1], avg.data[2]).h;
      }
    } catch {
      // leave color fields undefined
    }

    return {
      src: `/photography/${dirName}/${filename}`,
      ratio,
      angle: deterministicAngle(filename),
      dominantHue,
      dominantSat,
      dominantLight,
    };
  }));

  photoCache.set(dirName, result);
  return result;
}

/** Build all sections with photos populated from the filesystem. */
export async function buildSections(): Promise<Section[]> {
  if (sectionsCache) return sectionsCache;
  sectionsCache = await Promise.all(
    SECTION_META.map(async (meta) => ({
      ...meta,
      photos: meta.dir ? await getPhotosForDir(meta.dir) : [],
    }))
  );
  return sectionsCache;
}

/** Build a single section by ID. Returns undefined if ID is unknown. */
export async function buildSection(id: string): Promise<Section | undefined> {
  const meta = SECTION_META.find((s) => s.id === id);
  if (!meta) return undefined;
  const sections = await buildSections();
  return sections.find((s) => s.id === id);
}
