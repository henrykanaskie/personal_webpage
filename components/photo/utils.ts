import { getImageProps } from "next/image";
import type { PhotoEntry, PhotoExif } from "@/app/photography/data";
import { photo as photoTokens } from "@/lib/tokens";

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Small uppercase monospace labels, the photography side's captions and rails. */
export const MONO: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
};

/** Width / height as a number, from the snapped "w/h" ratio string. */
export function aspect(photo: PhotoEntry): number {
  if (photo.width && photo.height) return photo.width / photo.height;
  const [w, h] = photo.ratio.split("/").map(Number);
  return w / h || 1.5;
}

/**
 * The optimised copy of a chapter's cover used to fill its photo title. Shared
 * so the flight can preload exactly the file the chapter page will ask for.
 */
export function coverSrc(photo: PhotoEntry): string {
  return getImageProps({ src: photo.src, alt: "", width: 1600, height: Math.round(1600 / aspect(photo)), quality: 70 }).props.src;
}

/** Starts downloading and decoding an image; resolves when it's ready to paint (or failed). */
export function preloadImage(src: string): Promise<void> {
  const img = new Image();
  img.src = src;
  return img.decode().catch(() => {});
}

/**
 * Frame-rate independent smoothing factor. `perFrame` is the fraction of the
 * remaining distance to close per 60fps frame; `dt` is elapsed ms. On a 120Hz
 * screen each frame closes less, so motion feels identical at any refresh rate.
 */
export function smoothing(perFrame: number, dt: number): number {
  return 1 - Math.pow(1 - perFrame, Math.min(dt, 100) / (1000 / 60));
}

/** Tracks the time between animation frames, starting from the first call. */
export function frameClock() {
  let last = 0;
  return (now: number) => {
    const dt = last ? now - last : 1000 / 60;
    last = now;
    return dt;
  };
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

// Model codes as written to EXIF, mapped to the names people actually use
const CAMERA_NAMES: Record<string, string> = {
  "SONY ILCE-7M4": "Sony α7 IV",
  "SONY ILCE-7M3": "Sony α7 III",
  "SONY ILCE-7RM5": "Sony α7R V",
  "SONY ILCE-6400": "Sony α6400",
};

export function cameraName(exif: PhotoExif): string | undefined {
  if (!exif.camera) return undefined;
  return CAMERA_NAMES[exif.camera] ?? exif.camera;
}

export function formatShutter(s?: number): string | undefined {
  if (!s) return undefined;
  if (s >= 1) return `${Number(s.toFixed(1))}″`;
  return `1/${Math.round(1 / s)}`;
}

export function formatAperture(f?: number): string | undefined {
  return f ? `ƒ/${Number(f.toFixed(1))}` : undefined;
}

export function formatFocal(mm?: number): string | undefined {
  return mm ? `${Math.round(mm)}mm` : undefined;
}

/** "#rrggbb" to "r,g,b" for use inside rgba(). */
export function rgbTriplet(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** Photography theme tokens shared by the redesigned components. */
export function photoTheme(isDark: boolean) {
  return isDark
    ? {
        // Neutral warm greys so the photos carry the colour; the accent is the site's periwinkle
        bg: photoTokens.background.dark,
        ink: photoTokens.ink.dark,
        sub: "rgba(236, 233, 228, 0.6)",
        faint: "rgba(236, 233, 228, 0.34)",
        rule: "rgba(255, 255, 255, 0.1)",
        accent: "rgb(150, 165, 255)",
        accentSoft: "rgba(150, 165, 255, 0.22)",
        glass: "rgba(14, 14, 16, 0.62)",
      }
    : {
        // Ink on paper; the accent is the site's rose
        bg: photoTokens.background.light,
        ink: photoTokens.ink.light,
        sub: "rgba(30, 27, 25, 0.62)",
        faint: "rgba(30, 27, 25, 0.38)",
        rule: "rgba(30, 27, 25, 0.12)",
        accent: "rgb(196, 52, 98)",
        accentSoft: "rgba(196, 52, 98, 0.16)",
        glass: "rgba(250, 248, 244, 0.72)",
      };
}

/** Tell the fixed photography nav to hide while an overlay is open. */
export function signalLightbox(open: boolean) {
  window.dispatchEvent(new CustomEvent("photoLightbox", { detail: { open } }));
}
