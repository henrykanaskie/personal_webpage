import { buildSections } from "../getPhotos";
import type { PhotoEntry } from "../data";
import AboutClient, { Bucket, ShootingStats } from "./AboutClient";

export const dynamic = "force-static";

/** Count photos into labelled ranges; `test` decides membership for each range. */
function bucket(photos: PhotoEntry[], ranges: [string, (p: PhotoEntry) => boolean][]): Bucket[] {
  return ranges.map(([label, test]) => ({ label, count: photos.filter(test).length }));
}

/** Frequency table, most used first, with unrecorded values last. */
function tally(values: string[]): Bucket[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((x, y) => (x.label === UNKNOWN ? 1 : y.label === UNKNOWN ? -1 : y.count - x.count));
}

const UNKNOWN = "Not recorded";

// EXIF lens strings are written by the lens firmware; tidy the common ones up
function lensName(raw?: string): string {
  if (!raw || /^-+$/.test(raw)) return UNKNOWN;
  if (raw.includes("24-70mm F2.8 DG DN")) return "Sigma 24-70mm ƒ/2.8 Art";
  if (raw.includes("70-200mm F2.8 DG DN")) return "Sigma 70-200mm ƒ/2.8 Sports";
  return raw
    .replace(/(\d+)\.0/g, "$1")
    .replace(/ mm/g, "mm")
    .replace(/f\//gi, "ƒ/");
}

function bodyName(raw?: string): string {
  if (!raw) return UNKNOWN;
  if (raw.includes("ILCE-7M4")) return "Sony α7 IV";
  if (raw.includes("NIKON Z 6")) return "Nikon Z 6";
  return raw;
}

function chroma(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return Math.max(...c) - Math.min(...c);
}

const vivid = (colors: string[]) => colors.reduce((best, c) => (chroma(c) > chroma(best) ? c : best), colors[0]);

function hue(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  // Near-greys go to the end of the strip, ordered by lightness
  if (d < 0.08) return 400 + max * 100;
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

export default async function PhotographyAboutPage() {
  const sections = await buildSections();
  const photos = sections.flatMap((s) => s.photos);
  const withShutter = photos.filter((p) => p.exif.shutter);
  const isos = photos.map((p) => p.exif.iso).filter((v): v is number => !!v);

  const f = (p: PhotoEntry) => p.exif.focal ?? 0;
  const a = (p: PhotoEntry) => p.exif.aperture ?? 0;
  const s = (p: PhotoEntry) => p.exif.shutter ?? 0;

  const stats: ShootingStats = {
    frames: photos.length,
    chapters: sections.filter((sec) => sec.photos.length > 0).length,
    fastest: withShutter.length ? Math.min(...withShutter.map(s)) : null,
    longest: withShutter.length ? Math.max(...withShutter.map(s)) : null,
    isoMin: isos.length ? Math.min(...isos) : null,
    isoMax: isos.length ? Math.max(...isos) : null,
    focal: bucket(photos, [
      ["24-34mm", (p) => f(p) > 0 && f(p) < 35],
      ["35-49mm", (p) => f(p) >= 35 && f(p) < 50],
      ["50-69mm", (p) => f(p) >= 50 && f(p) < 70],
      ["70mm", (p) => f(p) >= 70 && f(p) < 71],
      ["Over 70mm", (p) => f(p) >= 71],
    ]),
    aperture: bucket(photos, [
      ["ƒ/1.4-2.8", (p) => a(p) > 0 && a(p) <= 2.8],
      ["ƒ/3.2-5.6", (p) => a(p) > 2.8 && a(p) <= 5.6],
      ["ƒ/6.3-10", (p) => a(p) > 5.6 && a(p) <= 10],
      ["ƒ/11-22", (p) => a(p) > 10],
    ]),
    shutter: bucket(photos, [
      ["1/2000+", (p) => s(p) > 0 && s(p) <= 1 / 2000],
      ["1/500-1/1600", (p) => s(p) > 1 / 2000 && s(p) <= 1 / 500],
      ["1/60-1/400", (p) => s(p) > 1 / 500 && s(p) <= 1 / 60],
      ["1/50-1/2", (p) => s(p) > 1 / 60 && s(p) < 1],
      ["1″ and longer", (p) => s(p) >= 1],
    ]),
    lenses: tally(photos.map((p) => lensName(p.exif.lens))),
    bodies: tally(photos.map((p) => bodyName(p.exif.camera))),
    // Each frame's most vivid palette colour; dominant colours alone are mostly night-sky black
    strip: photos.map((p) => vivid(p.palette.length ? p.palette : [p.color])).sort((x, y) => hue(x) - hue(y)),
  };

  return <AboutClient stats={stats} />;
}
