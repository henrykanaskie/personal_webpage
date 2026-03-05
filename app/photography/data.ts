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
  photos: PhotoEntry[];
}

export const SECTIONS: Section[] = [
  {
    id: "portraits",
    num: "01",
    title: "Portraits",
    sub: "People & Light",
    darkAccent: [110, 140, 255],
    lightAccent: [210, 60, 110],
    cols: 3,
    photos: [
      // Replace these with real portrait files once you add a /photography/portraits folder
      { src: "/photography/placeholder.svg", ratio: "2/3", angle: 155 },
      { src: "/photography/placeholder.svg", ratio: "2/3", angle: 135 },
      { src: "/photography/placeholder.svg", ratio: "1/1", angle: 165 },
      { src: "/photography/placeholder.svg", ratio: "2/3", angle: 145 },
      { src: "/photography/placeholder.svg", ratio: "1/1", angle: 150 },
      { src: "/photography/placeholder.svg", ratio: "2/3", angle: 160 },
    ],
  },
  {
    id: "landscape",
    num: "02",
    title: "Landscape",
    sub: "Horizons & Earth",
    darkAccent: [110, 140, 255],
    lightAccent: [210, 60, 110],
    cols: 3,
    photos: [
      { src: "/photography/nature/DSC08190.jpg", ratio: "2/3", angle: 155 },
      { src: "/photography/nature/DSC02629 (1).jpg", ratio: "3/2", angle: 135 },
      { src: "/photography/nature/DSC05497 (1).jpg", ratio: "2/3", angle: 165 },
      { src: "/photography/nature/DSC08520.jpg", ratio: "3/2", angle: 145 },
      {
        src: "/photography/nature/DSC00824-Enhanced-NR.JPG",
        ratio: "2/3",
        angle: 140,
      },
      { src: "/photography/nature/DSC02213 (1).jpg", ratio: "2/3", angle: 130 },
      { src: "/photography/nature/DSC08739.jpg", ratio: "2/3", angle: 150 },
      { src: "/photography/nature/DSC08791.jpg", ratio: "3/2", angle: 160 },
    ],
  },
  {
    id: "astrophotography",
    num: "03",
    title: "Astrophotography",
    sub: "Night Sky & Stars",
    darkAccent: [110, 140, 255],
    lightAccent: [210, 60, 110],
    cols: 3,
    photos: [
      { src: "/photography/astro/M31 (1).jpg", ratio: "2/3", angle: 155 },
      { src: "/photography/astro/DSC02102 (1).jpg", ratio: "3/2", angle: 135 },
      { src: "/photography/astro/DSC04795 (1).jpg", ratio: "2/3", angle: 165 },
      { src: "/photography/astro/DSC08958 (1).jpg", ratio: "2/3", angle: 145 },
    ],
  },
  {
    id: "street",
    num: "04",
    title: "Street",
    sub: "Urban & Moments",
    darkAccent: [110, 140, 255],
    lightAccent: [210, 60, 110],
    cols: 3,
    photos: [
      { src: "/photography/street/DSC01039.jpg", ratio: "4/5", angle: 155 },
      { src: "/photography/street/DSC01105.jpg", ratio: "2/3", angle: 135 },
      { src: "/photography/street/DSC01243 (1).jpg", ratio: "2/3", angle: 165 },
      { src: "/photography/street/DSC01590.JPG", ratio: "2/3", angle: 145 },
      {
        src: "/photography/street/DSC07734-2 (1).jpg",
        ratio: "2/3",
        angle: 150,
      },
      { src: "/photography/street/HK0_1105.JPG", ratio: "2/3", angle: 160 },
      {
        src: "/photography/street/DSC00824-Enhanced-NR.JPG",
        ratio: "2/3",
        angle: 140,
      },
    ],
  },
];
