// ─── Server-only: reads photos from the filesystem at build time ──────────────
// This file must only be imported by server components (no "use client").

import fs from "fs";
import path from "path";
import sizeOf from "image-size";
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

async function getPhotosForDir(dirName: string): Promise<PhotoEntry[]> {
  if (photoCache.has(dirName)) return photoCache.get(dirName)!;

  const dir = path.join(process.cwd(), "public", "photography", dirName);
  if (!fs.existsSync(dir)) {
    photoCache.set(dirName, []);
    return [];
  }

  // Sort alphabetically by filename — camera filenames (DSC####) are sequential
  // so this preserves the order photos were added to the folder.
  const files = fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(path.extname(f)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

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

    return {
      src: `/photography/${dirName}/${filename}`,
      ratio,
      angle: deterministicAngle(filename),
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
