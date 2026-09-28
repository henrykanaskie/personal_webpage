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

// ─── Palette ──────────────────────────────────────────────────────────────────
// Colours are compared in OKLab, where equal distances look equally different
// (in raw RGB, two dark greys can be "far apart" while two vivid hues are "close").

const linear = (u: number) => ((u /= 255) <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4));
const gamma = (u: number) => 255 * (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);

function toOklab(r8: number, g8: number, b8: number): [number, number, number] {
  const r = linear(r8), g = linear(g8), b = linear(b8);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

function oklabHex([L, a, b]: readonly number[]): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const c = (v: number) => Math.max(0, Math.min(255, gamma(v)));
  return hex(c(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), c(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), c(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s));
}

const chromaOf = (c: readonly number[]) => Math.hypot(c[1], c[2]);
const dist = (p: readonly number[], q: readonly number[]) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

interface Swatch {
  c: number[];
  n: number; // pixels
  w: number; // salience-weighted pixels
}

/** k-means over the points at `idx` in the flat Lab array, weighted; deterministic. */
function kmeans(lab: Float32Array, idx: Int32Array, weight: Float32Array | null, k: number, iterations: number) {
  const cents: number[][] = [];
  // Seed with well-spread points (farthest-point, weighted), from a fixed pseudo-random sequence
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const at = (i: number) => [lab[i * 3], lab[i * 3 + 1], lab[i * 3 + 2]];
  cents.push(at(idx[Math.floor(rnd() * idx.length)]));
  while (cents.length < k) {
    let best = cents[0], bestD = -1;
    for (let t = 0; t < 600; t++) {
      const i = idx[Math.floor(rnd() * idx.length)];
      const p = at(i);
      const d = Math.min(...cents.map((c) => dist(c, p))) * (weight ? weight[i] : 1);
      if (d > bestD) (bestD = d), (best = p);
    }
    cents.push(best);
  }
  const assign = new Int32Array(idx.length);
  const sum = new Float64Array(k * 4);
  for (let it = 0; it < iterations; it++) {
    sum.fill(0);
    for (let j = 0; j < idx.length; j++) {
      const o = idx[j] * 3, L = lab[o], A = lab[o + 1], B = lab[o + 2];
      let bi = 0, bd = Infinity;
      for (let c = 0; c < k; c++) {
        const cc = cents[c], dl = L - cc[0], da = A - cc[1], db = B - cc[2];
        const d = dl * dl + da * da + db * db; // squared: same nearest centre, no square root
        if (d < bd) (bd = d), (bi = c);
      }
      assign[j] = bi;
      const w = weight ? weight[idx[j]] : 1;
      sum[bi * 4] += L * w;
      sum[bi * 4 + 1] += A * w;
      sum[bi * 4 + 2] += B * w;
      sum[bi * 4 + 3] += w;
    }
    for (let c = 0; c < k; c++) if (sum[c * 4 + 3]) cents[c] = [sum[c * 4] / sum[c * 4 + 3], sum[c * 4 + 1] / sum[c * 4 + 3], sum[c * 4 + 2] / sum[c * 4 + 3]];
  }
  return { cents, assign };
}

/**
 * Up to five colours a viewer would name for the photo, most prominent first.
 *
 * The old method counted pixels in a fixed RGB grid and kept the fullest cells,
 * so it favoured big areas of shadow and grey, split any gradient (a sky, an
 * aurora, skin in shade) across cells too small to win, and averaged vivid
 * pixels into mud. Here:
 *   - pixels are clustered in OKLab, with vivid pixels counting for more, since
 *     the eye goes to them first
 *   - each cluster shows the colour of its more vivid half, so shading doesn't
 *     grey it out
 *   - the three strongest clusters, then the most vivid remaining ones
 *   - and a small vivid detail (a crest, a row of lights) that can't win a
 *     cluster of its own is looked for among the vivid pixels alone
 * The sample is resized with nearest-neighbour so small details keep their real
 * colour instead of being blended into their surroundings.
 */
function palette(px: Buffer): string[] {
  const n = Math.floor(px.length / 3);
  const lab = new Float32Array(n * 3);
  const weight = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const c = toOklab(px[i * 3], px[i * 3 + 1], px[i * 3 + 2]);
    lab.set(c, i * 3);
    weight[i] = 1 + 14 * chromaOf(c);
  }
  const all = Int32Array.from({ length: n }, (_, i) => i);
  const K = 14;
  const { cents, assign } = kmeans(lab, all, weight, K, 14);

  // each cluster's colour: the mean of its more vivid half
  const members: number[][] = cents.map(() => []);
  assign.forEach((c, j) => members[c].push(j));
  let swatches: Swatch[] = members
    .filter((m) => m.length > 0)
    .map((m) => {
      const chroma = m.map((i) => Math.hypot(lab[i * 3 + 1], lab[i * 3 + 2]));
      const cut = [...chroma].sort((a, b) => a - b)[Math.floor(m.length / 2)];
      const vivid = m.filter((_, j) => chroma[j] >= cut);
      const c = [0, 1, 2].map((t) => vivid.reduce((acc, i) => acc + lab[i * 3 + t], 0) / vivid.length);
      return { c, n: m.length, w: m.reduce((acc, i) => acc + weight[i], 0) };
    });

  // clusters that read as the same colour become one
  for (let merged = true; merged; ) {
    merged = false;
    for (let i = 0; i < swatches.length && !merged; i++)
      for (let j = i + 1; j < swatches.length && !merged; j++)
        if (dist(swatches[i].c, swatches[j].c) < 0.06) {
          const a = swatches[i], b = swatches[j], w = a.w + b.w;
          swatches[i] = { n: a.n + b.n, w, c: a.c.map((v, t) => (v * a.w + b.c[t] * b.w) / w) };
          swatches = swatches.filter((_, k) => k !== j);
          merged = true;
        }
  }
  swatches.sort((a, b) => b.w - a.w);

  const chosen: Swatch[] = [];
  const distinct = (x: Swatch, min: number) => chosen.every((y) => dist(x.c, y.c) > min);
  for (const x of swatches) if (chosen.length < 3 && distinct(x, 0.08)) chosen.push(x);
  const accents = swatches
    .filter((x) => !chosen.includes(x) && x.n / n >= 0.004)
    .sort((a, b) => b.w * (0.2 + chromaOf(b.c) * 8) - a.w * (0.2 + chromaOf(a.c) * 8));
  for (const x of accents) if (chosen.length < 5 && distinct(x, 0.09)) chosen.push(x);

  // the vivid detail pass
  const vividIdx = all.filter((i) => lab[i * 3] > 0.35 && Math.hypot(lab[i * 3 + 1], lab[i * 3 + 2]) > 0.09);
  if (vividIdx.length >= n * 0.003) {
    const v = kmeans(lab, vividIdx, null, 3, 8);
    const counts = v.cents.map((_, c) => v.assign.filter((a) => a === c).length);
    const top = counts.indexOf(Math.max(...counts));
    const detail: Swatch = { c: v.cents[top], n: counts[top], w: 0 };
    if (detail.n / n >= 0.003 && distinct(detail, 0.09)) {
      if (chosen.length >= 5) chosen.pop();
      chosen.push(detail);
    }
  }

  chosen.sort((a, b) => b.w - a.w);
  return chosen.map((x) => oklabHex(x.c));
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
      // nearest-neighbour: small details keep their real colour instead of being blended away
      image.clone().resize(180, 180, { fit: "inside", kernel: "nearest" }).removeAlpha().raw().toBuffer(),
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
