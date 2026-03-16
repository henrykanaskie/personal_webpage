// ─── Shared photography section data ─────────────────────────────────────────

export type RGB = [number, number, number];

export interface PhotoEntry {
  src: string;
  ratio: string;
  angle: number;
  alt?: string;
}

export interface Section {
  id: string;
  num: string;
  title: string;
  sub: string;
  darkAccent: RGB;
  lightAccent: RGB;
  cols: number;
  /** Folder name under public/photography/. If absent, section shows no photos. */
  dir?: string;
  /** Populated at build time by getPhotos.ts */
  photos: PhotoEntry[];
}

// Section metadata only — photos are populated server-side from the filesystem.
// To add a new section: add an entry here and create the matching folder under public/photography/<dir>/.
export const SECTION_META: Omit<Section, "photos">[] = [
  {
    id: "portraits",
    num: "01",
    title: "Portraits",
    sub: "People & Light",
    darkAccent: [110, 140, 255],
    lightAccent: [210, 60, 110],
    cols: 3,
    dir: "portraits",
  },
  {
    id: "nature",
    num: "02",
    title: "Nature",
    sub: "Horizons & Earth",
    darkAccent: [110, 140, 255],
    lightAccent: [210, 60, 110],
    cols: 3,
    dir: "nature",
  },
  {
    id: "astrophotography",
    num: "03",
    title: "Astrophotography",
    sub: "Night Sky & Stars",
    darkAccent: [110, 140, 255],
    lightAccent: [210, 60, 110],
    cols: 3,
    dir: "astro",
  },
  {
    id: "street",
    num: "04",
    title: "Street",
    sub: "Urban & Moments",
    darkAccent: [110, 140, 255],
    lightAccent: [210, 60, 110],
    cols: 3,
    dir: "street",
  },
  {
    id: "automotive",
    num: "05",
    title: "Automotive",
    sub: "Cars & Machines",
    darkAccent: [110, 140, 255],
    lightAccent: [210, 60, 110],
    cols: 3,
    dir: "automotive",
  },
  {
    id: "natl-parks",
    num: "06",
    title: "Natl Parks",
    sub: "Parks & Wilderness",
    darkAccent: [110, 140, 255],
    lightAccent: [210, 60, 110],
    cols: 3,
    dir: "natl-parks",
  },
];
