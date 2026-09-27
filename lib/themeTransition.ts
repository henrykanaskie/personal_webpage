"use client";

import { paper, photo } from "./tokens";

// ─── Theme transition: the halftone curtain ─────────────────────────────────
// Switching between light and dark is done with the page's own dot grid.
// From the toggle, the dots swell outward in a wave, in the colour of the
// sheet they're about to become, until they close up and cover the page
// (a halftone going solid). Under that cover the theme swaps. Then the same
// wave runs again: the dots shrink back down to ordinary dots, now in the new
// ink, revealing the page in the other theme around them.
//
// It draws on a 2D canvas laid over everything, so it works in every browser
// (Safari included), and the dots sit exactly on the page's grid (the `paper`
// token), so the curtain is the paper itself rather than something over it.

const GAP = paper.gap;
const R_FULL = GAP * Math.SQRT1_2 + 0.75; // a dot this big covers its whole cell
const SPREAD = 0.34; // seconds for the wave to cross the screen
const GROW = 0.22; // seconds each dot takes to close up
const HOLD = 0.04; // a beat fully covered while the theme swaps
const SHRINK = 0.28; // seconds each dot takes to shrink back

let running = false;

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function runThemeTransition({
  x,
  y,
  toDark,
  photoSide,
  apply,
}: {
  /** Where the wave starts (the toggle's centre), viewport px. */
  x: number;
  y: number;
  toDark: boolean;
  photoSide: boolean;
  /** Switches the theme; called once, while the page is fully covered. */
  apply: () => void;
}) {
  if (running) return;
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    apply();
    return;
  }

  // The sheet it becomes, and (on the CS side) the dot it ends as.
  const bg = photoSide ? hex(toDark ? photo.background.dark : photo.background.light) : [...(toDark ? paper.dark.bg : paper.light.bg)];
  const pal = toDark ? paper.dark : paper.light;
  const endR = photoSide ? 0 : paper.dotRadius;
  // the ink the old sheet had, for the fine ring on each growing dot
  const ring = toDark ? "rgba(255,255,255,0.22)" : "rgba(20,18,15,0.18)";

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    zIndex: "2147483000",
    pointerEvents: "none",
  } as CSSStyleDeclaration);
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    apply();
    return;
  }
  running = true;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.scale(dpr, dpr);

  // The page's grid, in viewport coordinates (the dots are page-anchored).
  const sx = window.scrollX, sy = window.scrollY;
  const ox = GAP / 2 - (((sx % GAP) + GAP) % GAP), oy = GAP / 2 - (((sy % GAP) + GAP) % GAP);
  const cols = Math.ceil(w / GAP) + 2, rows = Math.ceil(h / GAP) + 2;
  const maxD = Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y)) || 1;
  const cells: { cx: number; cy: number; delay: number }[] = [];
  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const cx = ox + c * GAP, cy = oy + r * GAP;
      cells.push({ cx, cy, delay: (Math.hypot(cx - x, cy - y) / maxD) * SPREAD });
    }
  }

  const T_COVER = SPREAD + GROW;
  const T_REVEAL = T_COVER + HOLD;
  const T_END = T_REVEAL + SPREAD + SHRINK;
  const bgCss = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
  let swapped = false;
  const t0 = performance.now();

  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, w, h);

    if (t < T_REVEAL) {
      // swell: each dot grows, on its own delay, until the cells close up
      ctx.fillStyle = bgCss;
      ctx.beginPath();
      const ringed: [number, number, number, number][] = [];
      for (const c of cells) {
        const k = clamp01((t - c.delay) / GROW);
        if (k <= 0) continue;
        const r = R_FULL * easeInOut(k);
        ctx.moveTo(c.cx + r, c.cy);
        ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);
        if (k < 1) ringed.push([c.cx, c.cy, r, Math.sin(Math.PI * k)]);
      }
      ctx.fill();
      // a hairline in the old ink around each dot while it grows: a halftone,
      // printed, rather than a fill
      ctx.lineWidth = 1;
      for (const [cx, cy, r, a] of ringed) {
        ctx.globalAlpha = a;
        ctx.strokeStyle = ring;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (t >= T_COVER && !swapped) {
        swapped = true;
        apply();
      }
    } else {
      // shrink: the same wave again, each dot back down to an ordinary dot in
      // the new ink, uncovering the page around it
      for (const c of cells) {
        const k = clamp01((t - T_REVEAL - c.delay) / SHRINK);
        const e = easeInOut(k);
        const r = R_FULL + (endR - R_FULL) * e;
        if (r <= 0.05) continue;
        // the last stretch turns from the sheet colour to the dot's own ink,
        // then lets go, so it lands on the real dot underneath
        const ink = clamp01((k - 0.6) / 0.4);
        const a = k >= 1 ? 0 : 1 - ink * (photoSide ? 0 : 0.35);
        if (a <= 0) continue;
        const cr = bg[0] + (pal.dot[0] - bg[0]) * ink * pal.dotAlpha;
        const cg = bg[1] + (pal.dot[1] - bg[1]) * ink * pal.dotAlpha;
        const cb = bg[2] + (pal.dot[2] - bg[2]) * ink * pal.dotAlpha;
        ctx.globalAlpha = a;
        ctx.fillStyle = `rgb(${cr | 0},${cg | 0},${cb | 0})`;
        ctx.beginPath();
        ctx.arc(c.cx, c.cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (t < T_END) requestAnimationFrame(frame);
    else {
      canvas.remove();
      running = false;
    }
  };
  requestAnimationFrame(frame);

  // Never leave the page covered: if frames stall (a background tab), finish on a timer.
  window.setTimeout(() => {
    if (!swapped) {
      swapped = true;
      apply();
    }
  }, (T_COVER + 0.5) * 1000);
  window.setTimeout(() => {
    if (running) {
      canvas.remove();
      running = false;
    }
  }, (T_END + 1) * 1000);
}
