// ─── Drawings on the paper ──────────────────────────────────────────────────
// The line drawings are drawn by the DOM while they draw themselves (a CSS
// stroke transition), then handed to DotField: each one is rasterised, when
// it comes near the screen, into an image covering its paths, and DotField
// paints it into the paper as a texture, exactly where the SVG sits (its screen CTM, so
// rotations and flips come along). From then on the drawing is part of what
// the glass sees: a card's frost blurs it, a card's rim and a swell bend it,
// with the same lens as the dots. The SVG itself is hidden only while
// DotField is actually painting it, so without WebGL (or when there are more
// drawings on screen than it takes, or before its raster is ready) the DOM
// copy is what you see.

export type Drawing = {
  svg: SVGSVGElement;
  /** User-space rect the rasters cover (the SVG's own units). */
  box: { x: number; y: number; w: number; h: number };
  /**
   * Rasterises the drawing in a theme. DotField asks for it only when the
   * drawing comes near the screen (or the theme changes while it's there),
   * uploads it, and lets the image go: a canvas per drawing per theme was
   * close to half a gigabyte on the CS page.
   */
  raster: (dark: boolean) => Promise<HTMLCanvasElement | null>;
};

const drawings = new Set<Drawing>();
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((f) => f());

export function registerDrawing(d: Drawing) {
  drawings.add(d);
  changed();
  return () => {
    drawings.delete(d);
    d.svg.style.visibility = "";
    changed();
  };
}

export const allDrawings = () => drawings;

/** Called when the set changes (DotField wakes to draw it). */
export function onDrawingsChange(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}

const pow2 = (n: number) => Math.pow(2, Math.ceil(Math.log2(Math.max(1, n))));

/**
 * Rasterises an SVG's drawing (its <defs> and the group of paths) into a
 * power-of-two canvas covering `box`, at about `pxPerUnit` pixels per SVG
 * unit. The CSS that animates the strokes doesn't reach an SVG loaded as an
 * image, so this is the drawing fully drawn.
 */
export async function rasterDrawing(
  svg: SVGSVGElement,
  box: Drawing["box"],
  pxPerUnit: number,
  /** The stroke pattern's image to use (the theme's). */
  patternHref?: string,
): Promise<HTMLCanvasElement | null> {
  const W = Math.min(2048, pow2(box.w * pxPerUnit));
  const H = Math.min(2048, pow2(box.h * pxPerUnit));
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("viewBox", `${box.x} ${box.y} ${box.w} ${box.h}`);
  clone.setAttribute("preserveAspectRatio", "none");
  clone.setAttribute("width", String(W));
  clone.setAttribute("height", String(H));
  clone.removeAttribute("style");
  clone.style.visibility = "visible";
  if (patternHref) clone.querySelectorAll("pattern image").forEach((im) => im.setAttribute("href", patternHref));
  const xml = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  try {
    await img.decode();
  } catch {
    return null;
  }
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, W, H);
  return c;
}
