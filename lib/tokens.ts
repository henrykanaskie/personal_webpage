// ─── Design Tokens ──────────────────────────────────────────────────────────
// The values scripts need as numbers (shaders, canvases). Everything the DOM
// can resolve itself lives as CSS variables in app/globals.css.

// ─── Paper ──────────────────────────────────────────────────────────────────
// Mirrors --paper, --dot and --dot-gap in app/globals.css. The WebGL dot field
// paints over the CSS dots, so these must match exactly or the seam shows.

export const paper = {
  gap: 24,
  dotRadius: 1.15,
  light: { bg: [0xf1, 0xf0, 0xed], dot: [52, 48, 42], dotAlpha: 0.3 },
  dark: { bg: [0x0c, 0x0d, 0x10], dot: [196, 204, 222], dotAlpha: 0.18 },
  // The cards' fill (--card-fill), the same as the bubbles' (--bubble-fill):
  // the shaders paint it wherever a card's liquid edge reaches past its DOM box.
  glass: {
    light: { fill: [255, 255, 255], alpha: 0.14 },
    dark: { fill: [255, 255, 255], alpha: 0.035 },
  },
} as const;

// ─── Photography ────────────────────────────────────────────────────────────
// The darkroom sheet. Also painted by the boot script in app/layout.tsx before
// React hydrates, so a reload never flashes the CS paper.

export const photo = {
  background: {
    light: "#f8f5f0",
    dark: "#050507",
  },
  ink: {
    light: "rgb(30, 27, 25)",
    dark: "rgb(236, 233, 228)",
  },
} as const;
