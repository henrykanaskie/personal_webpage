"use client";

import { paper, photo } from "./tokens";

// ─── Theme transition: the assembly ─────────────────────────────────────────
// Switching between light and dark builds the new sheet out of plates, like
// armour closing over a frame. The page is cut into plates along the seams
// between the grid's dots (so the plates are the paper's own cells, grouped),
// and from the toggle:
//
//   1. as the wave reaches each plate, its outline is traced from the corner
//      nearest the toggle, two welding points running round it in the glass
//      edge's thin film (pink left, cyan right, violet top, gold below);
//   2. the plate slides into place, a single shutter from the side facing the
//      toggle or a pair of leaves meeting in the middle, its chrome leading
//      edge catching the light, and stops dead (no overshoot);
//   3. it locks: the seam flashes, brackets clamp its corners, and the seam
//      fades into the new page.
//
// Where the browser has View Transitions the theme swaps at once, the old page
// is held as a snapshot, and each plate is a window onto the new theme, so the
// new page is always right behind the plates, never a blank sheet. The window
// is a paint worklet mask in Chromium and a per-frame stack of CSS mask layers
// elsewhere (the same geometry, from `reveal` below). The seams and sparks
// are a canvas carried above both snapshots under its own
// view-transition-name, so it stays live while the snapshots are held.
//
// Without View Transitions it falls back to the curtain: the plates assemble
// in the new sheet's colour until they cover the page, the theme swaps under
// the cover, and the plates fade away in the same wave.

const GAP = paper.gap;
const SPREAD = 0.9; // seconds for the wave to cross the screen
const TRACE = 0.28; // seconds to trace a plate's outline
const SLIDE = 0.34; // seconds for a plate to slide home
const LOCK = 0.42; // seconds for the lock flash to fade
const JITTER = 0.08; // plates don't all move in step, like separate servos
const MIN_CELLS = 2; // the smallest plate side, in grid cells
const FADE = 0.3; // curtain only: seconds each cover plate takes to fade

// A plate: [x, y, w, h, delay, kind, axis, sign] in viewport px and seconds.
// kind 0 is a shutter, 1 a pair of leaves; axis 0 slides along x, 1 along y;
// sign +1 comes in from the left/top, -1 from the right/bottom.
type Plate = number[];

let running = false;

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

// The part of a plate that has slid home at time t, as flat [x, y, w, h]
// rects (none, one, or two for leaves). Written with nothing from outside its
// own body, because the paint worklet gets a copy of its source.
function reveal(p: number[], t: number, trace: number, slide: number): number[] {
  const k = (t - p[4] - trace) / slide;
  if (k <= 0) return [];
  if (k >= 1) return [p[0], p[1], p[2], p[3]];
  // a servo: pulls away, runs, and brakes hard into place
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const x = p[0], y = p[1], w = p[2], h = p[3];
  const len = p[6] === 0 ? w : h;
  if (p[5] === 1) {
    const s = (len * e) / 2;
    return p[6] === 0 ? [x, y, s, h, x + w - s, y, s, h] : [x, y, w, s, x, y + h - s, w, s];
  }
  const s = len * e;
  const o = p[7] > 0 ? 0 : len - s;
  return p[6] === 0 ? [x + o, y, s, h] : [x, y + o, w, s];
}

// A small seeded generator, so a layout is one coherent cut of the sheet.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cut the viewport into plates along the seams between the page's dots.
function layout(x: number, y: number, w: number, h: number): { plates: Plate[]; last: number } {
  const sx = window.scrollX, sy = window.scrollY;
  // the dots sit at ox + c * GAP (page-anchored); the seams halfway between
  const gx = GAP / 2 - (((sx % GAP) + GAP) % GAP) - GAP / 2;
  const gy = GAP / 2 - (((sy % GAP) + GAP) % GAP) - GAP / 2;
  const cols = Math.ceil((w - gx) / GAP), rows = Math.ceil((h - gy) / GAP);
  const maxD = Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y)) || 1;
  const rand = rng((Math.random() * 2 ** 32) | 0);
  const plates: Plate[] = [];
  let last = 0;

  const leaf = (c: number, r: number, cw: number, rh: number) => {
    const px = gx + c * GAP, py = gy + r * GAP, pw = cw * GAP, ph = rh * GAP;
    const dx = px + pw / 2 - x, dy = py + ph / 2 - y;
    const delay = (Math.hypot(dx, dy) / maxD) * SPREAD + rand() * JITTER;
    // slide outward, away from the toggle, mostly along the way the wave runs
    const axis = Math.abs(dx) * (0.6 + rand() * 0.8) > Math.abs(dy) ? 0 : 1;
    const sign = (axis === 0 ? dx : dy) >= 0 ? 1 : -1;
    // leaves only where each half is still a plate, not a sliver
    const kind = (axis === 0 ? cw : rh) >= 4 && rand() < 0.3 ? 1 : 0;
    plates.push([px, py, pw, ph, delay, kind, axis, sign]);
    last = Math.max(last, delay);
  };
  const split = (c: number, r: number, cw: number, rh: number) => {
    const canX = cw >= 2 * MIN_CELLS, canY = rh >= 2 * MIN_CELLS;
    const big = cw > 5 || rh > 4;
    if ((!canX && !canY) || (!big && rand() < 0.3)) return leaf(c, r, cw, rh);
    const alongX = canX && (!canY || cw * (0.7 + rand() * 0.6) >= rh);
    const len = alongX ? cw : rh;
    const cut = MIN_CELLS + Math.floor(rand() * (len - 2 * MIN_CELLS + 1));
    if (alongX) {
      split(c, r, cut, rh);
      split(c + cut, r, cw - cut, rh);
    } else {
      split(c, r, cw, cut);
      split(c, r + cut, cw, rh - cut);
    }
  };
  split(0, 0, cols, rows);
  return { plates, last };
}

// ─── The HUD ────────────────────────────────────────────────────────────────
// Seams, welding points, chrome leading edges and lock flashes.
// The same drawing serves the morph and the curtain.

// The glass edge's thin film, by side: top violet, right cyan, bottom gold,
// left pink (lib/gl.ts edgeFilm). On a light sheet it's pressed toward the
// graphite ink so it reads; on a dark one it's lifted toward white.
const FILM = [
  [185, 160, 255],
  [120, 205, 255],
  [255, 220, 140],
  [255, 150, 205],
];
function filmInk(side: number, onLight: boolean, a: number) {
  const f = FILM[side];
  const m = onLight ? [48, 50, 60] : [230, 234, 245];
  const k = onLight ? 0.5 : 0.3;
  const c = (i: number) => Math.round(f[i] + (m[i] - f[i]) * k);
  return `rgba(${c(0)},${c(1)},${c(2)},${a})`;
}

function makeHud(opts: { x: number; y: number; w: number; h: number; plates: Plate[]; toDark: boolean }) {
  const { x, y, w, h, plates, toDark } = opts;
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    zIndex: "2147483000",
    pointerEvents: "none",
    contain: "strict",
  } as CSSStyleDeclaration);
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx?.scale(dpr, dpr);
  // the old sheet is under the seams while they're traced, the new one under
  // the lock flash
  const oldLight = toDark, newLight = !toDark;
  const bright = oldLight ? "rgba(40,42,50," : "rgba(240,244,255,";

  // The corners clockwise from top left; side i runs from corner i to i + 1.
  const corners = (p: Plate) => [
    [p[0], p[1]],
    [p[0] + p[2], p[1]],
    [p[0] + p[2], p[1] + p[3]],
    [p[0], p[1] + p[3]],
  ];

  // Draw `len` px of the outline from corner s, clockwise (dir 1) or not
  // (dir -1), each side in its own film colour. Returns the head.
  const tracePath = (c: number[][], s: number, dir: number, len: number, a: number) => {
    let at = c[s];
    for (let i = 0; i < 2 && len > 0; i++) {
      const side = dir > 0 ? (s + i) % 4 : (s - i + 3) % 4;
      const to = c[dir > 0 ? (s + i + 1) % 4 : (s - i + 3) % 4];
      const seg = Math.hypot(to[0] - at[0], to[1] - at[1]);
      const f = Math.min(1, len / seg);
      const end = [at[0] + (to[0] - at[0]) * f, at[1] + (to[1] - at[1]) * f];
      ctx!.strokeStyle = filmInk(side, oldLight, a);
      ctx!.beginPath();
      ctx!.moveTo(at[0], at[1]);
      ctx!.lineTo(end[0], end[1]);
      ctx!.stroke();
      len -= seg;
      at = end;
    }
    return at;
  };

  const spark = (px: number, py: number, a: number) => {
    ctx!.fillStyle = `${bright}${0.16 * a})`;
    ctx!.beginPath();
    ctx!.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.fillStyle = oldLight ? `rgba(20,22,30,${0.9 * a})` : `rgba(255,255,255,${0.95 * a})`;
    ctx!.beginPath();
    ctx!.arc(px, py, 1.6, 0, Math.PI * 2);
    ctx!.fill();
  };

  // The chrome lip on a sliding plate's leading edge: a bright line with a
  // dark one just ahead of it, and a sheen on the plate behind.
  const edge = (rx: number, ry: number, rw: number, rh: number, axis: number, forward: boolean, a: number) => {
    const depth = Math.min(axis === 0 ? rw : rh, 20);
    if (depth < 1) return;
    let g: CanvasGradient;
    if (axis === 0) {
      const ex = forward ? rx + rw : rx;
      g = ctx!.createLinearGradient(ex - (forward ? depth : -depth), 0, ex, 0);
    } else {
      const ey = forward ? ry + rh : ry;
      g = ctx!.createLinearGradient(0, ey - (forward ? depth : -depth), 0, ey);
    }
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(1, `rgba(255,255,255,${(newLight ? 0.35 : 0.07) * a})`);
    ctx!.fillStyle = g;
    ctx!.fillRect(rx, ry, rw, rh);
    const line = (off: number, style: string) => {
      ctx!.strokeStyle = style;
      ctx!.beginPath();
      if (axis === 0) {
        const ex = (forward ? rx + rw : rx) + (forward ? off : -off);
        ctx!.moveTo(ex, ry);
        ctx!.lineTo(ex, ry + rh);
      } else {
        const ey = (forward ? ry + rh : ry) + (forward ? off : -off);
        ctx!.moveTo(rx, ey);
        ctx!.lineTo(rx + rw, ey);
      }
      ctx!.stroke();
    };
    ctx!.lineWidth = 1.5;
    line(-0.75, `rgba(255,255,255,${0.9 * a})`);
    ctx!.lineWidth = 1;
    line(0.5, `rgba(10,12,18,${0.45 * a})`);
  };

  const brackets = (p: Plate, a: number) => {
    const c = corners(p);
    const L = Math.min(8, p[2] / 4, p[3] / 4);
    ctx!.lineWidth = 1.5;
    ctx!.strokeStyle = newLight ? `rgba(30,32,40,${0.75 * a})` : `rgba(255,255,255,${0.9 * a})`;
    ctx!.beginPath();
    for (let i = 0; i < 4; i++) {
      const [cx, cy] = c[i];
      const sx = i === 0 || i === 3 ? 1 : -1, sy = i < 2 ? 1 : -1;
      ctx!.moveTo(cx + sx * L, cy + sy * 1);
      ctx!.lineTo(cx + sx * 1, cy + sy * 1);
      ctx!.lineTo(cx + sx * 1, cy + sy * L);
    }
    ctx!.stroke();
  };

  // The whole HUD at time t (seconds). `cover`, curtain only, fills each
  // plate's slid-home part in the new sheet's colour first.
  const draw = (t: number, cover?: (p: Plate, r: number[]) => void) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of plates) {
      const tp = t - p[4];
      if (tp <= 0) continue;
      const r = reveal(p, t, TRACE, SLIDE);
      if (cover) cover(p, r);
      const q = clamp01(tp / TRACE);
      const k = clamp01((tp - TRACE) / SLIDE);
      const l = clamp01((tp - TRACE - SLIDE) / LOCK);
      if (l >= 1) continue;
      const c = corners(p);

      // 2. the seam: traced both ways from the corner nearest the toggle
      const cx = p[0] + p[2] / 2, cy = p[1] + p[3] / 2;
      const s = x < cx ? (y < cy ? 0 : 3) : y < cy ? 1 : 2;
      const half = (p[2] + p[3]) * easeOut(q);
      ctx.lineWidth = 1;
      const seamA = 0.6 * (1 - l);
      const h1 = tracePath(c, s, 1, half, seamA);
      const h2 = tracePath(c, s, -1, half, seamA);
      if (q < 1) {
        spark(h1[0], h1[1], 1);
        spark(h2[0], h2[1], 1);
      }

      // 3. sliding home, the chrome lip on each leading edge
      if (k > 0 && k < 1) {
        const ax = p[6];
        if (p[5] === 1) {
          edge(r[0], r[1], r[2], r[3], ax, true, 1);
          edge(r[4], r[5], r[6], r[7], ax, false, 1);
        } else {
          edge(r[0], r[1], r[2], r[3], ax, p[7] > 0, 1);
        }
      }

      // 4. the lock: the seam flashes, the brackets clamp, all of it fades
      if (k >= 1) {
        const f = (1 - l) * (1 - l);
        ctx.fillStyle = `rgba(255,255,255,${(newLight ? 0.1 : 0.05) * f * f})`;
        ctx.fillRect(p[0], p[1], p[2], p[3]);
        ctx.lineWidth = 1.25;
        ctx.strokeStyle = newLight ? `rgba(30,32,40,${0.55 * f})` : `rgba(255,255,255,${0.7 * f})`;
        ctx.strokeRect(p[0] + 0.5, p[1] + 0.5, p[2] - 1, p[3] - 1);
        brackets(p, f);
      }
    }
  };

  return { canvas, ctx, draw };
}

export function runThemeTransition({
  x,
  y,
  toDark,
  photoSide,
  apply,
}: {
  /** Where the assembly starts (the toggle's centre), viewport px. */
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
    morph(x, y, toDark, apply);
    return;
  }
  curtain(x, y, toDark, photoSide, apply);
}

// ─── The curtain ────────────────────────────────────────────────────────────

function curtain(x: number, y: number, toDark: boolean, photoSide: boolean, apply: () => void) {
  const bg = photoSide ? hex(toDark ? photo.background.dark : photo.background.light) : [...(toDark ? paper.dark.bg : paper.light.bg)];
  const bgCss = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
  const w = window.innerWidth, h = window.innerHeight;
  const { plates, last } = layout(x, y, w, h);
  const hud = makeHud({ x, y, w, h, plates, toDark });
  if (!hud.ctx) {
    apply();
    return;
  }
  const ctx = hud.ctx;
  document.body.appendChild(hud.canvas);
  running = true;

  // covered once every plate is home; then the plates fade in the same wave
  const T_SWAP = last + TRACE + SLIDE + 0.05;
  const T_END = T_SWAP + SPREAD + JITTER + FADE;
  let swapped = false;
  const t0 = performance.now();

  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    if (t >= T_SWAP && !swapped) {
      swapped = true;
      apply();
    }
    hud.draw(t, (p, r) => {
      const a = swapped ? 1 - clamp01((t - T_SWAP - p[4]) / FADE) : 1;
      if (a <= 0) return;
      ctx.globalAlpha = a;
      ctx.fillStyle = bgCss;
      // a hair wider than the plate, so neighbours leave no seam of old page
      for (let i = 0; i < r.length; i += 4) ctx.fillRect(r[i] - 0.5, r[i + 1] - 0.5, r[i + 2] + 1, r[i + 3] + 1);
      ctx.globalAlpha = 1;
    });
    if (t < T_END) requestAnimationFrame(frame);
    else {
      hud.canvas.remove();
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
  }, (T_SWAP + 0.5) * 1000);
  window.setTimeout(() => {
    if (running) {
      hud.canvas.remove();
      running = false;
    }
  }, (T_END + 1) * 1000);
}

// ─── The morph ──────────────────────────────────────────────────────────────

// The paint worklet: the new page's mask, every plate's slid-home part. The
// plates arrive once as a flat list of numbers in --vt-plates.
const WORKLET = `
const reveal = (${reveal.toString()});
let key = "", plates = [];
registerPaint("assembly", class {
  static get inputProperties() {
    return ["--vt-t", "--vt-plates", "--vt-trace", "--vt-slide"];
  }
  paint(ctx, size, props) {
    const n = (k) => parseFloat(props.get(k).toString()) || 0;
    const src = props.get("--vt-plates").toString();
    if (src !== key) {
      key = src;
      const v = src.trim().split(/\\s+/).map(Number);
      plates = [];
      for (let i = 0; i + 8 <= v.length; i += 8) plates.push(v.slice(i, i + 8));
    }
    const t = n("--vt-t"), trace = n("--vt-trace"), slide = n("--vt-slide");
    ctx.fillStyle = "#000";
    ctx.beginPath();
    for (const p of plates) {
      const r = reveal(p, t, trace, slide);
      for (let i = 0; i < r.length; i += 4) ctx.rect(r[i] - 0.5, r[i + 1] - 0.5, r[i + 2] + 1, r[i + 3] + 1);
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

// Without the worklet: the same mask as a stack of CSS mask layers, one solid
// layer per slid-home rect, rewritten each frame.
function cssMask(plates: Plate[], t: number) {
  const img: string[] = [], size: string[] = [], pos: string[] = [];
  for (const p of plates) {
    const r = reveal(p, t, TRACE, SLIDE);
    for (let i = 0; i < r.length; i += 4) {
      img.push("linear-gradient(#000,#000)");
      size.push(`${(r[i + 2] + 1).toFixed(1)}px ${(r[i + 3] + 1).toFixed(1)}px`);
      pos.push(`${(r[i] - 0.5).toFixed(1)}px ${(r[i + 1] - 0.5).toFixed(1)}px`);
    }
  }
  const rule = img.length
    ? `mask-image:${img.join(",")};mask-size:${size.join(",")};mask-position:${pos.join(",")};mask-repeat:no-repeat;`
    : "mask-image:linear-gradient(transparent,transparent);";
  return `html.vt-css::view-transition-new(root){${rule}}`;
}

function morph(x: number, y: number, toDark: boolean, apply: () => void) {
  running = true;
  const root = document.documentElement;
  const w = window.innerWidth, h = window.innerHeight;
  const { plates, last } = layout(x, y, w, h);
  const T_END = last + TRACE + SLIDE + LOCK;
  const T_HOME = last + TRACE + SLIDE;
  const hud = makeHud({ x, y, w, h, plates, toDark });
  hud.canvas.style.setProperty("view-transition-name", "vt-hud");
  const vars: Record<string, string> = {
    "--vt-plates": plates.map((p) => p.map((v) => +v.toFixed(2)).join(" ")).join(" "),
    "--vt-trace": `${TRACE}`,
    "--vt-slide": `${SLIDE}`,
  };
  let sheet: HTMLStyleElement | null = null;
  let raf = 0;
  const done = () => {
    cancelAnimationFrame(raf);
    root.classList.remove("vt-assembly", "vt-paint", "vt-css");
    for (const k of Object.keys(vars)) root.style.removeProperty(k);
    hud.canvas.remove();
    sheet?.remove();
    running = false;
  };

  prepare().then((mode) => {
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    root.classList.add("vt-assembly", mode === "paint" ? "vt-paint" : "vt-css");
    if (mode === "css") {
      sheet = document.createElement("style");
      sheet.textContent = cssMask(plates, 0);
      document.head.appendChild(sheet);
    }
    let vt: { ready: Promise<void>; finished: Promise<void> };
    try {
      // the HUD joins in the new state only, so it's carried live above both snapshots
      vt = (document as Document & { startViewTransition: (cb: () => void) => typeof vt }).startViewTransition(() => {
        apply();
        document.body.appendChild(hud.canvas);
      });
    } catch {
      apply();
      done();
      return;
    }
    vt.ready
      .then(() => {
        // --vt-t runs from 0 to the end, in seconds; the worklet's mask follows
        // it, and it keeps the transition open until the last lock has faded
        root.animate({ "--vt-t": [0, T_END] } as unknown as Keyframe[], {
          duration: T_END * 1000,
          easing: "linear",
          fill: "forwards",
          pseudoElement: "::view-transition-new(root)",
        });
        const t0 = performance.now();
        const frame = (now: number) => {
          const t = (now - t0) / 1000;
          hud.draw(t);
          if (sheet) sheet.textContent = t >= T_HOME ? "" : cssMask(plates, t);
          if (t < T_END) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
      })
      .catch(() => {});
    vt.finished.then(done, done);
  });
}
