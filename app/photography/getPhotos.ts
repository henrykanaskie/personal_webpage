// ─── Server-only: reads photos from the filesystem at build time ──────────────
// This file must only be imported by server components (no "use client").

import fs from "fs";
import path from "path";
import sharp from "sharp";
import { SECTION_META } from "./data";
import type { Section, PhotoEntry } from "./data";
import { parseExif } from "./exif";

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
  for (const ch of filename) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return 130 + (hash % 40); // range: 130–169
}

const hex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/**
 * Representative palette from a small raw RGB sample: bucket colours into a
 * 4-bit-per-channel grid, then greedily take the most populated buckets that
 * are visibly distinct from those already chosen.
 */
function palette(px: Buffer): string[] {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < px.length; i += 3) {
    const r = px[i],
      g = px[i + 1],
      b = px[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  const ranked = [...buckets.values()].map((b) => ({ n: b.n, c: [b.r / b.n, b.g / b.n, b.b / b.n] as const })).sort((a, b) => b.n - a.n);
  const chosen: (readonly [number, number, number])[] = [];
  for (const { c } of ranked) {
    const distinct = chosen.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) > 56);
    if (distinct) chosen.push(c);
    if (chosen.length === 5) break;
  }
  return chosen.map((c) => hex(c[0], c[1], c[2]));
}

async function analysePhoto(filePath: string, dirName: string, filename: string): Promise<PhotoEntry> {
  const src = `/photography/${dirName}/${filename}`;
  const fallback: PhotoEntry = {
    src,
    ratio: "3/2",
    angle: deterministicAngle(filename),
    width: 1500,
    height: 1000,
    color: "#1a1822",
    palette: [],
    blur: "",
    exif: {},
  };

  try {
    const image = sharp(filePath).rotate();
    const meta = await image.metadata();
    // EXIF orientation 5-8 means the stored pixels are rotated a quarter turn
    const swap = (meta.orientation ?? 1) >= 5;
    const width = (swap ? meta.height : meta.width) ?? fallback.width;
    const height = (swap ? meta.width : meta.height) ?? fallback.height;

    const [sample, tiny, stats] = await Promise.all([
      image.clone().resize(96, 96, { fit: "inside" }).removeAlpha().raw().toBuffer(),
      image.clone().resize(16, 16, { fit: "inside" }).webp({ quality: 40 }).toBuffer(),
      image.clone().stats(),
    ]);
    const d = stats.dominant;

    return {
      ...fallback,
      ratio: snapRatio(width, height),
      width,
      height,
      color: hex(d.r, d.g, d.b),
      palette: palette(sample),
      blur: `data:image/webp;base64,${tiny.toString("base64")}`,
      exif: parseExif(meta.exif),
    };
  } catch {
    // If Sharp can't read a file, fall back to neutral defaults
    return fallback;
  }
}

async function getPhotosForDir(dirName: string): Promise<PhotoEntry[]> {
  if (photoCache.has(dirName)) return photoCache.get(dirName)!;

  const dir = path.join(process.cwd(), "public", "photography", dirName);
  if (!fs.existsSync(dir)) {
    photoCache.set(dirName, []);
    return [];
  }

  // Sort alphabetically by filename: camera filenames (DSC####) are sequential
  // so this preserves the order photos were added to the folder.
  const files = fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(path.extname(f)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  const result = await Promise.all(files.map((filename) => analysePhoto(path.join(dir, filename), dirName, filename)));

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
    })),
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
