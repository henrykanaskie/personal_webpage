import type { PhotoEntry, PhotoExif } from "@/app/photography/data";

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Width / height as a number, from the snapped "w/h" ratio string. */
export function aspect(photo: PhotoEntry): number {
  if (photo.width && photo.height) return photo.width / photo.height;
  const [w, h] = photo.ratio.split("/").map(Number);
  return w / h || 1.5;
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

/** "56mm · ƒ/2.8 · 1/800 · ISO 1250", skipping anything missing. */
export function exposureLine(exif: PhotoExif): string {
  return [formatFocal(exif.focal), formatAperture(exif.aperture), formatShutter(exif.shutter), exif.iso ? `ISO ${exif.iso}` : undefined]
    .filter(Boolean)
    .join("  ·  ");
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
        bg: "#050507",
        ink: "rgb(236, 228, 244)",
        title: "rgb(218, 198, 228)",
        sub: "rgba(198, 178, 218, 0.72)",
        faint: "rgba(198, 178, 218, 0.38)",
        rule: "rgba(195, 175, 225, 0.14)",
        accent: "rgb(150, 165, 255)",
        accentSoft: "rgba(150, 165, 255, 0.22)",
        glass: "rgba(12, 10, 18, 0.55)",
      }
    : {
        bg: "#f8f5f0",
        ink: "rgb(52, 38, 62)",
        title: "rgb(100, 80, 115)",
        sub: "rgba(110, 88, 128, 0.8)",
        faint: "rgba(110, 88, 128, 0.42)",
        rule: "rgba(128, 72, 138, 0.16)",
        accent: "rgb(210, 60, 110)",
        accentSoft: "rgba(210, 60, 110, 0.18)",
        glass: "rgba(250, 247, 242, 0.62)",
      };
}

/** Tell the fixed photography nav to hide while an overlay is open. */
export function signalLightbox(open: boolean) {
  window.dispatchEvent(new CustomEvent("photoLightbox", { detail: { open } }));
}
export type PhotoTheme = ReturnType<typeof photoTheme>;
