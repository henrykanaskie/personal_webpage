"use client";

import { paper, photo } from "./tokens";

// ─── Theme transition: the halftone morph ───────────────────────────────────
// Switching between light and dark is done with the page's own dot grid.
//
// Where the browser has View Transitions, it's one wave: the theme swaps at
// once, the old page is held as a snapshot on top, and from the toggle the
// grid's dots grow through that snapshot, each dot a window onto the page in
// its new theme, until they close up and the old page is gone. The new theme
// is always right behind the wave; nothing is ever covered by a blank sheet.
// In Chromium the mask is a paint worklet drawing exactly that halftone (every
// dot on the page's grid, growing on its own delay); elsewhere it's CSS masks:
// a dotted wave front with the new page solid behind it.
//
// Without View Transitions it falls back to the curtain: the dots swell in the
// new sheet's colour until they cover the page, the theme swaps under the
// cover, and the same wave shrinks them back to dots in the new ink. That runs
// on a 2D canvas over everything, so it works in every browser.
//
// Either way the dots sit exactly on the page's grid (the `paper` token), so
// the transition is the paper itself rather than something over it.

const GAP = paper.gap;
const R_FULL = GAP * Math.SQRT1_2 + 0.75; // a dot this big covers its whole cell
// Slow enough to watch: the wave visibly travels and each dot visibly swells
// and closes up, so the page reads as morphing from one sheet into the other.
const SPREAD = 0.75; // seconds for the wave to cross the screen
const GROW = 0.45; // seconds each dot takes to close up
const HOLD = 0.1; // curtain only: a beat fully covered while the theme swaps
const SHRINK = 0.5; // curtain only: seconds each dot takes to shrink back
// The morph is a single wave, so it gets a little more time per stage.
const M_SPREAD = 1.0;
const M_GROW = 0.6;

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
  /** Switches the theme; called once (under the snapshot, or under the curtain). */
  apply: () => void;
}) {
  if (running) return;
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    apply();
    return;
  }
  if ("startViewTransition" in document) {
    morph(x, y, apply);
    return;
  }
  curtain(x, y, toDark, photoSide, apply);
}

function curtain(x: number, y: number, toDark: boolean, photoSide: boolean, apply: () => void) {

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

// ─── The morph ──────────────────────────────────────────────────────────────

// The paint worklet: the new page's mask. Every cell of the page's grid gets a
// dot that starts growing when the wave reaches it and closes up its cell;
// where every cell has closed, one solid disc stands in for them.
const WORKLET = `
registerPaint("halftone", class {
  static get inputProperties() {
    return ["--vt-t", "--vt-x", "--vt-y", "--vt-ox", "--vt-oy", "--vt-maxd", "--vt-spread", "--vt-grow", "--vt-gap"];
  }
  paint(ctx, size, props) {
    const n = (k) => parseFloat(String(props.get(k))) || 0;
    const t = n("--vt-t"), x = n("--vt-x"), y = n("--vt-y"), ox = n("--vt-ox"), oy = n("--vt-oy");
    const maxd = n("--vt-maxd") || 1, spread = n("--vt-spread"), grow = n("--vt-grow"), gap = n("--vt-gap") || 24;
    const rFull = gap * Math.SQRT1_2 + 0.75;
    const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    ctx.fillStyle = "#000";
    // every cell nearer than this has closed up
    const dIn = ((t - grow) / spread) * maxd - gap;
    if (dIn > 0) { ctx.beginPath(); ctx.arc(x, y, dIn + gap * 0.5, 0, Math.PI * 2); ctx.fill(); }
    const dOut = (t / spread) * maxd;
    ctx.beginPath();
    for (let cy = oy - gap; cy < size.height + gap; cy += gap) {
      for (let cx = ox - gap; cx < size.width + gap; cx += gap) {
        const d = Math.hypot(cx - x, cy - y);
        if (d > dOut || d < dIn) continue;
        const k = Math.min(1, Math.max(0, (t - (d / maxd) * spread) / grow));
        if (k <= 0) continue;
        const r = rFull * ease(k);
        ctx.moveTo(cx + r, cy);
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }
});
`;

let setup: Promise<"paint" | "css"> | null = null;
function prepare(): Promise<"paint" | "css"> {
  if (setup) return setup;
  const css = CSS as unknown as {
    registerProperty?: (d: { name: string; syntax: string; inherits: boolean; initialValue: string }) => void;
    paintWorklet?: { addModule: (url: string) => Promise<void> };
  };
  // --vt-t has to be a registered number so it can be animated
  try {
    css.registerProperty?.({ name: "--vt-t", syntax: "<number>", inherits: true, initialValue: "0" });
  } catch {
    // already registered (a hot reload)
  }
  setup = css.paintWorklet
    ? css.paintWorklet
        .addModule(URL.createObjectURL(new Blob([WORKLET], { type: "text/javascript" })))
        .then(() => "paint" as const, () => "css" as const)
    : Promise.resolve("css" as const);
  return setup;
}

function morph(x: number, y: number, apply: () => void) {
  running = true;
  const root = document.documentElement;
  const w = window.innerWidth, h = window.innerHeight;
  const sx = window.scrollX, sy = window.scrollY;
  const ox = GAP / 2 - (((sx % GAP) + GAP) % GAP), oy = GAP / 2 - (((sy % GAP) + GAP) % GAP);
  const maxD = Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y)) || 1;
  const T_END = M_SPREAD + M_GROW;
  const vars: Record<string, string> = {
    "--vt-x": `${x}px`, "--vt-y": `${y}px`, "--vt-ox": `${ox}px`, "--vt-oy": `${oy}px`,
    "--vt-maxd": `${maxD}`, "--vt-spread": `${M_SPREAD}`, "--vt-grow": `${M_GROW}`, "--vt-gap": `${GAP}`,
  };
  const done = () => {
    root.classList.remove("vt-halftone", "vt-paint", "vt-css");
    for (const k of Object.keys(vars)) root.style.removeProperty(k);
    running = false;
  };

  prepare().then((mode) => {
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    root.classList.add("vt-halftone", mode === "paint" ? "vt-paint" : "vt-css");
    let vt: { ready: Promise<void>; finished: Promise<void> };
    try {
      vt = (document as Document & { startViewTransition: (cb: () => void) => typeof vt }).startViewTransition(apply);
    } catch {
      apply();
      done();
      return;
    }
    vt.ready
      .then(() => {
        // the wave: --vt-t runs from 0 to the end, in seconds, and the mask follows it
        root.animate({ "--vt-t": [0, T_END] } as unknown as Keyframe[], {
          duration: T_END * 1000,
          easing: "linear",
          fill: "forwards",
          pseudoElement: "::view-transition-new(root)",
        });
      })
      .catch(() => {});
    vt.finished.then(done, done);
  });
}
