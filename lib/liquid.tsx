"use client";

import { useEffect, useId, useRef, useState } from "react";
import { paper } from "./tokens";
import { FULLSCREEN_VERT, GLSL_GLASS, rgb } from "./gl";

// ─── Liquid glass ───────────────────────────────────────────────────────────
// Two pieces that make the info bubbles behave like glass droplets:
//
//   useGlassLens   the bubble refracts whatever is behind it (line drawings,
//                  titles, text): a backdrop-filter pointing at an SVG
//                  displacement map built for the bubble's exact shape.
//                  Chromium only; elsewhere the bubble is plain clear glass.
//
//   LiquidBud      while a bubble opens, it is born out of the card's side:
//                  the edge bulges, necks, pinches and bursts free (below).
//
//   setRingHole    opens the panel's rim (.ring-mask) where a swell leaves the
//                  card, so the border molds into the swell.

// ─── useGlassLens ───────────────────────────────────────────────────────────

const supportsLens = () =>
  typeof navigator !== "undefined" &&
  // backdrop-filter: url() renders only in Chromium; Safari and Firefox drop it.
  !!(navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands?.some(
    (b) => b.brand === "Chromium" || b.brand === "Google Chrome" || b.brand === "Microsoft Edge",
  );

// Displacement map for a rounded rectangle, encoded as R = x, G = y around 128.
// The bubble is a thick convex lens: flat across the middle (no distortion
// there), curving over in a band at the rim. Where the surface tilts, what's
// behind is seen from further in (magnified and compressed toward the edge),
// with the tilt following a circular profile, so the bend is gentle at the
// start of the band and steep at the very edge, as through real glass. Samples
// always come from inside the bubble, which is what keeps the rim clean (a map
// that looked outward read the empty space past the element's box).
// Built on the main thread, so it has to be cheap: one closed-form distance
// and normal per pixel (no sampling), the flat middle filled in one pass, a
// CPU-backed canvas (so encoding it doesn't stall on a GPU readback), and each
// size built once.
const lensCache = new Map<string, string>();
function lensMap(w: number, h: number, radius: number, bevel: number): string {
  const key = `${w}x${h}:${radius}:${bevel}`;
  const hit = lensCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "";
  const img = ctx.createImageData(w, h);
  const data = img.data;
  new Uint32Array(data.buffer).fill(0xff808080); // (128, 128, 128, 255): no displacement
  const r = Math.min(radius, w / 2, h / 2);
  const hw = w / 2, hh = h / 2;
  for (let j = 0; j < h; j++) {
    const dy = j + 0.5 - hh;
    const qy = Math.abs(dy) - hh + r;
    for (let i = 0; i < w; i++) {
      const dx = i + 0.5 - hw;
      const qx = Math.abs(dx) - hw + r;
      // signed distance to the rounded rectangle and its outward normal
      let sd: number, nx: number, ny: number;
      if (qx > 0 && qy > 0) {
        const l = Math.sqrt(qx * qx + qy * qy);
        sd = l - r; nx = qx / l; ny = qy / l;
      } else if (qx > qy) {
        sd = qx - r; nx = 1; ny = 0;
      } else {
        sd = qy - r; nx = 0; ny = 1;
      }
      const t = -sd / bevel; // 0 at the rim, 1 past the band
      if (t >= 1) continue;
      const u = 1 - Math.max(0, t);
      const tilt = 1 - Math.sqrt(Math.max(0, 1 - u * u)); // circular profile
      // sample inward, against the outward normal
      const o = (j * w + i) * 4;
      data[o] = 128 - 127 * Math.sign(dx) * nx * tilt;
      data[o + 1] = 128 - 127 * Math.sign(dy) * ny * tilt;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = c.toDataURL();
  lensCache.set(key, url);
  return url;
}

export function useGlassLens(
  ref: React.RefObject<HTMLElement | null>,
  { radius = 24, strength = 38, frost = "" }: { radius?: number; strength?: number; frost?: string } = {},
) {
  const id = `lens-${useId().replace(/:/g, "")}`;
  const [map, setMap] = useState<{ href: string; w: number; h: number } | null>(null);

  useEffect(() => {
    // Tells the CSS whether the real lens is on; without it (Safari, Firefox)
    // .glass-bubble draws a stand-in rim (html:not(.lens) in globals.css).
    document.documentElement.classList.toggle("lens", supportsLens());
    const el = ref.current;
    if (!el || !supportsLens()) return;
    let last = "";
    let idle = 0;
    const build = () => {
      // offsetWidth/Height ignore transforms, so the scale-in animation doesn't
      // make us rebuild the map every frame.
      const w = el.offsetWidth, h = el.offsetHeight;
      const key = `${w}x${h}`;
      if (!w || !h || key === last) return;
      last = key;
      setMap({ href: lensMap(w, h, radius, Math.min(22, Math.min(w, h) / 4)), w, h });
    };
    // The lens is only seen once the bubble has budded off, so it's built when
    // the page is idle rather than in the middle of a scroll.
    const schedule = () => {
      if (idle) return;
      const run = () => { idle = 0; build(); };
      idle = window.requestIdleCallback ? window.requestIdleCallback(run, { timeout: 600 }) : window.setTimeout(run, 200);
    };
    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (idle) (window.cancelIdleCallback ?? window.clearTimeout)(idle);
    };
  }, [ref, radius]);

  const filter = map ? (
    <svg width="0" height="0" aria-hidden style={{ position: "absolute", pointerEvents: "none" }}>
      <filter id={id} x="0" y="0" width={map.w} height={map.h} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feImage href={map.href} x="0" y="0" width={map.w} height={map.h} preserveAspectRatio="none" result="map" />
        {/* three passes at different strengths: glass bends each colour by a
            different amount, so edges seen through the rim split into a prism */}
        <feDisplacementMap in="SourceGraphic" in2="map" scale={strength} xChannelSelector="R" yChannelSelector="G" result="dR" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale={strength * 1.07} xChannelSelector="R" yChannelSelector="G" result="dG" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale={strength * 1.14} xChannelSelector="R" yChannelSelector="G" result="dB" />
        <feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
        <feColorMatrix in="dG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
        <feColorMatrix in="dB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
        <feComposite in="r" in2="g" operator="arithmetic" k2="1" k3="1" result="rg" />
        <feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" />
      </filter>
    </svg>
  ) : null;

  // The pill's own light blur stays underneath as the fallback wherever url() isn't honoured.
  // `frost` is appended after the lens, so a frosted bubble keeps its blur.
  const style: React.CSSProperties = map
    ? { backdropFilter: `url(#${id}) ${frost}`.trim(), WebkitBackdropFilter: `url(#${id}) ${frost}`.trim() }
    : {};

  return { filter, style };
}

// The lens filter as DOM, for an element that isn't rendered by React (the
// droplet LiquidBud flies): the same three-pass colour split as useGlassLens.
const SVGNS = "http://www.w3.org/2000/svg";
function lensFilterEl(id: string, href: string, w: number, h: number, strength: number): SVGSVGElement {
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  const f = document.createElementNS(SVGNS, "filter");
  const attrs = (el: Element, a: Record<string, string | number>) => { for (const k in a) el.setAttribute(k, String(a[k])); return el; };
  attrs(f, { id, x: 0, y: 0, width: w, height: h, filterUnits: "userSpaceOnUse", "color-interpolation-filters": "sRGB" });
  const add = (tag: string, a: Record<string, string | number>) => f.appendChild(attrs(document.createElementNS(SVGNS, tag), a));
  add("feImage", { href, x: 0, y: 0, width: w, height: h, preserveAspectRatio: "none", result: "map" });
  [["dR", 1], ["dG", 1.07], ["dB", 1.14]].forEach(([r, m]) =>
    add("feDisplacementMap", { in: "SourceGraphic", in2: "map", scale: strength * (m as number), xChannelSelector: "R", yChannelSelector: "G", result: r as string }));
  add("feColorMatrix", { in: "dR", type: "matrix", values: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", result: "r" });
  add("feColorMatrix", { in: "dG", type: "matrix", values: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", result: "g" });
  add("feColorMatrix", { in: "dB", type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", result: "b" });
  add("feComposite", { in: "r", in2: "g", operator: "arithmetic", k2: 1, k3: 1, result: "rg" });
  add("feComposite", { in: "rg", in2: "b", operator: "arithmetic", k2: 1, k3: 1 });
  svg.appendChild(f);
  return svg;
}

// ─── setRingHole ────────────────────────────────────────────────────────────
// Open (or close, r <= 0) a hole in a panel's rim at x, y (panel-local px).
// "s" is the cursor swell's hole ("b" is reserved for a second source).

const ringOf = new WeakMap<HTMLElement, HTMLElement | null>();
export function setRingHole(panel: HTMLElement, which: "s" | "b", x: number, y: number, r: number) {
  let ring = ringOf.get(panel);
  if (ring === undefined) {
    ring = panel.querySelector<HTMLElement>(":scope > .ring-mask");
    ringOf.set(panel, ring);
  }
  if (!ring) return;
  const on = r > 0.5;
  // on the rim element alone: set on the panel, every frame of a swell would
  // restyle the whole card's content
  ring.style.setProperty(`--${which}x`, on ? `${x.toFixed(1)}px` : "-9999px");
  ring.style.setProperty(`--${which}y`, on ? `${y.toFixed(1)}px` : "-9999px");
  ring.style.setProperty(`--${which}r`, on ? `${r.toFixed(1)}px` : "0px");
}

// ─── Buds on the paper ──────────────────────────────────────────────────────
// A bud's glass is drawn by DotField, not by the bud's own canvas: DotField
// paints the line drawings (lib/drawings), so only it can frost and bend them
// through the growing shape. Each frame a bud publishes its shape here in
// viewport px (the same signed distance field its canvas uses), and DotField
// makes it part of the glass; the bud's canvas keeps what sits on top of the
// glass (the rim, the film, the shadow, and the freed drop's fill).

export type BudShape = {
  card: [number, number, number, number]; // x, y, w, h
  drop: [number, number, number, number]; // cx, cy, half-w, half-h
  cardR: number;
  dropR: number;
  k: number; // smooth union reach
  bubble: number; // 0 before the break, 1 once the drop is free (its DOM lens takes over)
  stub: [number, number, number]; // x, y, radius of the recoil on the card's side
};
export const buds = new Set<BudShape>();
const budListeners = new Set<() => void>();
export function onBudsChange(f: () => void) {
  budListeners.add(f);
  return () => budListeners.delete(f);
}
const budsChanged = () => budListeners.forEach((f) => f());

// A bud steps inside DotField's frame, just before DotField draws, so the
// glass (DotField's) and the rim (the bud's own canvas) come from the same
// state in the same frame. On separate animation frames the glass trailed the
// rim by a frame whenever DotField happened to run first. Without DotField
// (no WebGL, or its context lost) a bud runs on its own frames.
type BudTick = (now: number) => void;
export const budTicks = new Set<BudTick>();
export const glassDriver = { active: false };
/** DotField calls this once a frame, before it reads `buds`. */
export function stepBuds(now: number) {
  for (const tick of Array.from(budTicks)) tick(now);
}
/** DotField stopped driving (context lost, unmounted): the buds go back to their own frames. */
export function releaseBuds() {
  glassDriver.active = false;
  for (const tick of Array.from(budTicks)) { budTicks.delete(tick); requestAnimationFrame(tick); }
}

// ─── LiquidBud ──────────────────────────────────────────────────────────────
// The info bubble is born out of the side of its card, the way a soap film
// buds: the card's own edge swells, and keeps swelling, into a dome; the dome
// stretches outward and its base draws in to a neck; the neck gives, and the
// bubble comes free and eases onto its box, with no bounce, while the
// card's side settles back flat.
//
// All of it is one signed distance field: the card (a rounded box), smoothly
// unioned with the bubble (and, after the break, a shrinking stub on the card's
// side). The smooth union's reach starts wide, so the first swell is a broad
// bulge of the card itself, and narrows as the bubble pulls away, which is what
// draws the neck in until it pinches. The surface starts as the card's
// frosted glass and thins, the further it's stretched out of the card, into
// the bubble's clear iridescent film. The edge is never lost: around the bud
// the card's own (DOM) rim is opened (setRingHole) and the canvas draws the
// rim of card and bulge as one outline there, handing over across a 40px
// falloff; chrome on the card, turning to thin film along the stretch, so the
// bubble is visibly made of the card's edge and carries it away. Only what lies outside the card is filled (the card is DOM), plus a
// thin band inside its edge near the bud so the frost bends continuously.
// When it settles, the real frosted bubble fades in.

const BUD_FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uPage;   // page position of the canvas' top-left, css px
uniform vec4 uCard;   // x, y, w, h (canvas space)
uniform float uCardR;
uniform vec4 uDrop;   // cx, cy, half-w, half-h
uniform float uDropR, uK;
uniform vec3 uStub;   // the card side's recoil after the break: x, y, radius
uniform vec3 uHole;   // the hole opened in the card's rim: x, y, radius
uniform float uBubble; // 0 card material, 1 see-through bubble
uniform float uBubA;
uniform float uRim;   // the canvas's rim round the whole shape, in as the card's own rim hides
uniform float uAlpha, uDark;
uniform float uGap, uDotR, uDotA;
uniform vec3 uBg, uDot, uFill;
uniform float uFillA;
${GLSL_GLASS}
// the line drawings are DotField's (it's under this canvas); none drawn here
vec4 drawings(vec2 p, float blur) { return vec4(0.0); }
float card(vec2 p) { return sdBox(p, uCard.xy + uCard.zw * 0.5, uCard.zw * 0.5, uCardR); }
float cardStub(vec2 p) {
  float c = card(p);
  if (uStub.z > 0.3) c = smin(c, length(p - uStub.xy) - uStub.z, 22.0);
  return c;
}
float drop(vec2 p) { return sdBox(p, uDrop.xy, uDrop.zw, uDropR); }
float scene(vec2 p) {
  float c = cardStub(p);
  if (uDrop.z < 0.3) return c;
  return smin(c, drop(p), uK);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  float d = scene(p);
  float dc = card(p);
  float aa = 0.8 / uDpr;
  float outside = smoothstep(-aa, aa, dc);            // the card is DOM
  float inL = 1.0 - smoothstep(-aa, aa, d);
  float cover = inL * outside;
  vec4 outc = vec4(0.0);

  // a soft contact shadow under the growth and the bubble, like the card's own
  // (wide and faint: a tight one reads as an outline around the droplet)
  // Cast only by what the bud adds beyond the card: the card casts its own
  // (CSS) shadow, and a second one round its whole edge appeared, darkening
  // the card's outline, the moment this canvas came up.
  vec2 ps = p - vec2(0.0, 10.0);
  float ds = scene(ps);
  float added = clamp((card(ps) - ds) / 10.0, 0.0, 1.0);
  float sh = smoothstep(34.0, -12.0, ds) * added * outside * (1.0 - inL);
  outc = vec4(0.0, 0.0, 0.0, 1.0) * sh * (0.05 + 0.16 * uDark);

  vec2 g = vec2(scene(p + vec2(1.0, 0.0)) - d, scene(p + vec2(0.0, 1.0)) - d);
  vec2 n = normalize(g + 1e-5);
  // How far the surface has been stretched out of the card: 0 on the card,
  // 1 some way out along the bulge, and 1 for the freed droplet. A stretched
  // film thins, so it turns from the card's frosted surface into the bubble's
  // clear, iridescent one.
  float isDrop = uBubble * smoothstep(1.0, -1.0, drop(p) - cardStub(p));
  float stretch = max(smoothstep(2.0, 38.0, dc), isDrop);
  // thin film colour, the same as the settled bubble's (.glass-bubble::after)
  vec3 film = edgeFilm(n);

  if (cover > 0.0) {
    // The glass itself (frost, lens, fill) is DotField's, under this canvas
    // (BudShape): it paints the drawings, so it bends them through the bulge
    // as it forms. Here only what lies on the glass: the film glowing toward
    // the rim where the surface is stretched thin, and, once the drop is free
    // (DotField leaves it to the droplet's DOM lens), the bubble's light fill.
    float f = pow(1.0 - clamp(-d / 14.0, 0.0, 1.0), 2.0);
    float fa = f * (0.1 + 0.04 * uDark);
    float fill = uBubA * isDrop;
    vec4 bubM = vec4(vec3(fill) + film * fa, fill + fa);
    outc = mix(outc, bubM, cover * stretch);
  }

  // The edge. Cards and bubbles share one glass edge, so around the bud the
  // canvas draws that edge round card and bulge as one outline, and the bubble
  // leaves carrying it.
  float line = 1.0 - smoothstep(0.0, 1.1, abs(d + 0.6));
  float glow = smoothstep(-6.0, -0.5, d) * (1.0 - smoothstep(-0.5, 0.5, d));
  // the glass edge (--edge-lip, --edge-film): a hairline all round, brighter
  // on top, a little on the bottom, and the film band just inside it
  float lipA = edgeLip(n, uDark);
  vec3 rimCol = vec3(1.0);
  // only near the bud: elsewhere the card's own (DOM) edge is still there,
  // and the two hand over across the same 40px falloff the rim's hole uses
  float own = uHole.z > 0.5 ? 1.0 - clamp((length(p - uHole.xy) - uHole.z) / 40.0, 0.0, 1.0) : 0.0;
  float reach = uRim * max(own, smoothstep(0.5, 1.5, dc));
  float rimA = line * lipA * reach;
  float filmA = glow * edgeFilmA(uDark) * reach;
  outc = vec4(film, 1.0) * filmA + outc * (1.0 - filmA);
  outc = vec4(rimCol, 1.0) * rimA + outc * (1.0 - rimA);
  gl_FragColor = outc * uAlpha;
}
`;

type Spring = { x: number; v: number };
// Damped harmonic step. zeta < 1 overshoots; zeta = 1 settles without one.
function stepSpring(s: Spring, target: number, omega: number, zeta: number, dt: number) {
  const n = 4; // substeps keep it stable at 30fps
  for (let i = 0; i < n; i++) {
    const h = dt / n;
    s.v += (-2 * zeta * omega * s.v - omega * omega * (s.x - target)) * h;
    s.x += s.v * h;
  }
}
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// Timeline (ms): the side swells, then stretches and necks, then breaks.
// Bud canvases are pooled. Creating a WebGL context is slow (on some drivers
// it takes a large part of a second, blocking the page), and each bud used to
// make its own the moment its card scrolled into view: that was the stutter
// while scrolling. A pooled canvas keeps its context and compiled shader and is
// simply moved into whichever card is budding (a canvas keeps its context when
// it moves in the DOM). The first one is made while the page is idle, and the
// shader compiles in the background where the browser can
// (KHR_parallel_shader_compile). Buds drawing at the same moment each take
// their own; only a few are kept.
type BudGL = {
  gl: WebGLRenderingContext;
  canvas: HTMLCanvasElement;
  prog: WebGLProgram;
  par: { COMPLETION_STATUS_KHR: number } | null;
  state: "compiling" | "ready" | "failed";
  U: (n: string) => WebGLUniformLocation | null;
};
const budPool: BudGL[] = [];
const BUD_POOL_MAX = 2;

function makeBudGL(): BudGL | null {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.width = canvas.height = 1;
  Object.assign(canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none" });
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const x = gl.createShader(type)!;
    gl.shaderSource(x, src);
    gl.compileShader(x);
    return x;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, FULLSCREEN_VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, BUD_FRAG));
  gl.linkProgram(prog);
  const locs = new Map<string, WebGLUniformLocation | null>();
  return {
    gl,
    canvas,
    prog,
    par: gl.getExtension("KHR_parallel_shader_compile"),
    state: "compiling",
    U: (n) => {
      let l = locs.get(n);
      if (l === undefined) { l = gl.getUniformLocation(prog, n); locs.set(n, l); }
      return l;
    },
  };
}

function takeBudGL(): BudGL | null {
  while (budPool.length) {
    const b = budPool.pop()!;
    if (!b.gl.isContextLost() && b.state !== "failed") return b;
  }
  return makeBudGL();
}

function returnBudGL(b: BudGL) {
  b.canvas.remove();
  b.canvas.width = b.canvas.height = 1; // give the memory back while it waits
  if (budPool.length < BUD_POOL_MAX && !b.gl.isContextLost() && b.state !== "failed") budPool.push(b);
  else b.gl.getExtension("WEBGL_lose_context")?.loseContext();
}

// Asking whether a program linked blocks until it has; with the extension we
// can first ask, without blocking, whether it's finished compiling.
function budState(b: BudGL): BudGL["state"] {
  if (b.state !== "compiling") return b.state;
  const { gl, prog, par } = b;
  if (par && !gl.getProgramParameter(prog, par.COMPLETION_STATUS_KHR)) return "compiling";
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    // a broken shader would otherwise just skip the animation silently
    if (process.env.NODE_ENV !== "production") console.error("LiquidBud shader:", gl.getProgramInfoLog(prog));
    return (b.state = "failed");
  }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  return (b.state = "ready");
}

// Make the first one before any bud needs it, while the page is idle.
if (typeof window !== "undefined") {
  const warm = () => {
    if (budPool.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const b = makeBudGL();
    if (b) budPool.push(b);
  };
  if (window.requestIdleCallback) window.requestIdleCallback(warm, { timeout: 3000 });
  else window.setTimeout(warm, 1500);
}

const SWELL_MS = 560;
const NECK_MS = 330;

export function LiquidBud({
  bubbleRef,
  cardRadius = 24,
  bubbleRadius = 24,
  onDone,
}: {
  /** The bubble, already at its resting position (invisible); its offsetParent is the overlay over the card. */
  bubbleRef: React.RefObject<HTMLElement | null>;
  cardRadius?: number;
  /** Corner radius of the finished bubble (anything at least half its size makes it round). */
  bubbleRadius?: number;
  /** Called when the bubble has settled onto its box. */
  onDone: () => void;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const [box, setBox] = useState<{ left: number; top: number; w: number; h: number } | null>(null);
  const [gone, setGone] = useState(false);

  // Size the canvas to cover the card and the bubble's resting box, plus room for the wobble and shadow.
  useEffect(() => {
    const bubble = bubbleRef.current;
    const host = bubble?.offsetParent as HTMLElement | null;
    if (!bubble || !host) { doneRef.current(); setGone(true); return; }
    const hr = host.getBoundingClientRect();
    const br = bubble.getBoundingClientRect();
    const M = 80;
    // Never wider than the viewport: a canvas hanging past the screen's edge
    // widens the page, and on a phone the whole page then slides sideways.
    const vw = document.documentElement.clientWidth;
    const l = Math.max(-hr.left, Math.min(0, br.left - hr.left) - M), t = Math.min(0, br.top - hr.top) - M;
    const r = Math.min(vw - hr.left, Math.max(hr.width, br.right - hr.left) + M), b = Math.max(hr.height, br.bottom - hr.top) + M;
    setBox({ left: l, top: t, w: r - l, h: b - t });
  }, [bubbleRef]);

  useEffect(() => {
    const holder = holderRef.current;
    const bubble = bubbleRef.current;
    const host = bubble?.offsetParent as HTMLElement | null;
    if (!box || !holder || !bubble || !host) return;
    const finish = () => { doneRef.current(); setGone(true); };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    const b = takeBudGL();
    if (!b) { finish(); return; }
    const { gl, U, canvas } = b;
    holder.appendChild(canvas);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.w * dpr);
    canvas.height = Math.round(box.h * dpr);

    // Geometry in canvas space, measured once: the bubble already sits,
    // invisible, exactly where it will end up.
    const hr = host.getBoundingClientRect();
    const br = bubble.getBoundingClientRect();
    const card = { x: -box.left, y: -box.top, w: hr.width, h: hr.height };
    const goal = { cx: br.left - hr.left - box.left + br.width / 2, cy: br.top - hr.top - box.top + br.height / 2, hw: br.width / 2, hh: br.height / 2 };

    // Which side it buds from, the point on that side, and the outward normal.
    const dxOut = goal.cx > card.x + card.w ? goal.cx - (card.x + card.w) : goal.cx < card.x ? card.x - goal.cx : 0;
    const dyOut = goal.cy > card.y + card.h ? goal.cy - (card.y + card.h) : goal.cy < card.y ? card.y - goal.cy : 0;
    const sideways = dxOut >= dyOut;
    const inset = cardRadius * 1.6 + 30;
    let ex: number, ey: number, nx = 0, ny = 0;
    if (sideways) {
      nx = goal.cx > card.x + card.w / 2 ? 1 : -1;
      ex = nx > 0 ? card.x + card.w : card.x;
      ey = Math.min(card.y + card.h - inset, Math.max(card.y + inset, goal.cy));
    } else {
      ny = goal.cy > card.y + card.h / 2 ? 1 : -1;
      ey = ny > 0 ? card.y + card.h : card.y;
      ex = Math.min(card.x + card.w - inset, Math.max(card.x + inset, goal.cx));
    }
    // The bud grows to about this radius before it lets go.
    const rb = Math.max(22, Math.min(46, Math.min(goal.hw, goal.hh) * 0.4));

    const dark = document.documentElement.classList.contains("dark");
    const pal = dark ? paper.dark : paper.light;
    const glass = dark ? paper.glass.dark : paper.glass.light;
    const bubA = dark ? 0.035 : 0.14; // .glass-bubble's fill (white, low strength)

    // The card element whose rim we open: the liquid panel that fills the host.
    let panel: HTMLElement | null = null;
    let best = 12;
    document.querySelectorAll<HTMLElement>("[data-liquid]").forEach((el) => {
      const r = el.getBoundingClientRect();
      const e = Math.abs(r.left - hr.left) + Math.abs(r.top - hr.top) + Math.abs(r.width - hr.width) + Math.abs(r.height - hr.height);
      if (e < best) { best = e; panel = el; }
    });
    const hole = { x: ex, y: ey, r: 0 };

    // The droplet: once it pinches free, the bubble's real lens flies with it,
    // under the canvas (which keeps drawing the rim, film and shadow), so what
    // it passes over bends through it exactly as through the settled bubble.
    // It sits at the bubble's box and is carried there by a transform that
    // follows the same spring, corners and all. Chromium only, like the lens.
    let droplet: HTMLDivElement | null = null;
    let dropletSvg: SVGSVGElement | null = null;
    if (supportsLens()) {
      const gw = Math.round(goal.hw * 2), gh = Math.round(goal.hh * 2);
      const href = lensMap(gw, gh, Math.min(bubbleRadius, gw / 2, gh / 2), Math.min(22, Math.min(gw, gh) / 4));
      if (href) {
        const fid = `budlens-${Math.random().toString(36).slice(2)}`;
        dropletSvg = lensFilterEl(fid, href, gw, gh, 38);
        droplet = document.createElement("div");
        Object.assign(droplet.style, {
          position: "absolute",
          left: `${goal.cx - gw / 2}px`,
          top: `${goal.cy - gh / 2}px`,
          width: `${gw}px`,
          height: `${gh}px`,
          transformOrigin: "50% 50%",
          pointerEvents: "none",
          opacity: "0",
          backdropFilter: `url(#${fid}) var(--glass-frost)`,
          webkitBackdropFilter: `url(#${fid}) var(--glass-frost)`,
        } as Partial<CSSStyleDeclaration>);
        holder.insertBefore(dropletSvg, canvas);
        holder.insertBefore(droplet, canvas);
      }
    }
    // The card keeps its own (DOM) rim; around the bud it's opened
    // (setRingHole) and the canvas draws the edge there instead, round card
    // and bulge as one shape, handing over across the same falloff.

    // After the break: springs carry the bubble to its box, and the stub on the card's side recoils.
    const flight: Spring = { x: 0, v: 0 };
    const from = { cx: 0, cy: 0, hw: 0, hh: 0 };
    const stub: Spring = { x: 0, v: 0 };
    let broken = false;
    let brokeAt = 0;
    let t0 = performance.now();
    let last = t0, raf = 0, fade = 1, fading = false, fadeAt = 0;

    const shape: BudShape = { card: [0, 0, 0, 0], drop: [0, 0, 0, 0], cardR: 0, dropR: 0, k: 1, bubble: 0, stub: [0, 0, 0] };
    let started = false;
    // the next step: inside DotField's frame when it's drawing the glass, else our own
    const schedule = () => {
      if (glassDriver.active) { budTicks.add(frame); budsChanged(); }
      else raf = requestAnimationFrame(frame);
    };
    const frame = (now: number) => {
      budTicks.delete(frame);
      const st = budState(b);
      if (st === "failed" || gl.isContextLost()) { finish(); return; }
      if (st === "compiling") { schedule(); return; }
      if (!started) { started = true; t0 = last = now; } // the bud's clock starts once it can draw
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      const t = now - t0;
      let cx: number, cy: number, hw: number, hh: number, k: number;

      if (t < SWELL_MS + NECK_MS) {
        if (t < SWELL_MS) {
          // swell: the bud rises from inside the card, so what shows is the
          // card's own side bulging, broad at first (a wide smooth union)
          const e = smooth(t / SWELL_MS);
          const r = rb * (0.55 + 0.45 * e);
          const out = -r + (r * 1.25) * e;
          cx = ex + nx * out; cy = ey + ny * out; hw = hh = r;
          k = 70 - 12 * e;
          hole.r = r + k * 0.9 + 6;
        } else {
          // stretch: it pulls away, faster and faster, and the union's reach
          // narrows so the base draws in to a neck until it pinches
          const e = clamp01((t - SWELL_MS) / NECK_MS);
          const a = e * e;
          const out = rb * 0.25 + rb * 1.55 * a;
          cx = ex + nx * out; cy = ey + ny * out;
          // stretched along the pull, thinner across it
          const along = rb * (1 + 0.22 * a), across = rb * (1 - 0.1 * a);
          hw = nx !== 0 ? along : across; hh = nx !== 0 ? across : along;
          k = 58 - 42 * a;
          hole.r = across + k * 0.9 + 6;
        }
      } else {
        if (!broken) {
          // the break: the bubble leaves from where the neck let go, with the
          // speed it had, and the card's side keeps a stub that snaps back
          broken = true;
          const out = rb * 1.8;
          from.cx = ex + nx * out; from.cy = ey + ny * out;
          from.hw = nx !== 0 ? rb * 1.22 : rb * 0.9; from.hh = nx !== 0 ? rb * 0.9 : rb * 1.22;
          // carry the stretch's speed into the flight, as a rate of progress
          const v = (rb * 1.55 * 2) / (NECK_MS / 1000);
          const dist = Math.hypot(goal.cx - from.cx, goal.cy - from.cy) || 1;
          flight.x = 0; flight.v = Math.min(4, v / dist);
          stub.x = rb * 0.55; stub.v = 0;
          brokeAt = t;
        }
        // One motion: a single spring carries the bubble from where it broke
        // off to its box, moving and growing together (size, position and
        // corners all follow the same progress). Critically damped, so it eases
        // in with no bounce at all (the starting speed is below omega, so it
        // can't overshoot either). Two springs (one to move, one to grow) made
        // it arrive and then inflate, like filling a shape.
        stepSpring(flight, 1, 8.5, 1, dt);
        // the card's side settles back flat, no wobble
        stepSpring(stub, 0, 20, 1, dt);
        const q = flight.x;
        cx = from.cx + (goal.cx - from.cx) * q;
        cy = from.cy + (goal.cy - from.cy) * q;
        hw = Math.max(0, from.hw + (goal.hw - from.hw) * q);
        hh = Math.max(0, from.hh + (goal.hh - from.hh) * q);
        // It never touches the card again (a smooth union there made it
        // reconnect as it grew): as it swells it's pushed away to keep a gap.
        const GAP = 8;
        if (nx < 0) cx = Math.min(cx, ex - GAP - hw);
        if (nx > 0) cx = Math.max(cx, ex + GAP + hw);
        if (ny < 0) cy = Math.min(cy, ey - GAP - hh);
        if (ny > 0) cy = Math.max(cy, ey + GAP + hh);
        k = 0.5; // a plain union from here on: separate shapes
        hole.r = clamp01(stub.x / (rb * 0.55)) * (rb * 0.55 + 30);
        const settled = Math.abs(1 - flight.x) < 0.004 && Math.abs(flight.v) < 0.05;
        const tb = t - SWELL_MS - NECK_MS;
        if ((settled || tb > 1800) && !fading) {
          fading = true;
          fadeAt = now;
          doneRef.current(); // the frosted bubble fades in over this one...
        }
        // ...as this one fades out (on the clock, not per frame, so dropped frames can't stall it)
        if (fading) fade = Math.max(0, 1 - (now - fadeAt) / 300);
      }
      // round while it's a bud; after the break the corners go from round to
      // the finished bubble's own on the same progress as everything else
      const small = Math.min(hw, hh);
      const dropR = broken
        ? Math.min(small, Math.min(from.hw, from.hh) + (Math.min(bubbleRadius, goal.hw, goal.hh) - Math.min(from.hw, from.hh)) * clamp01(flight.x))
        : small;

      if (droplet) {
        const on = broken ? clamp01((t - brokeAt) / 220) * fade : 0;
        droplet.style.opacity = on.toFixed(3);
        if (on > 0) {
          const sx = Math.max(0.01, hw / goal.hw), sy = Math.max(0.01, hh / goal.hh);
          droplet.style.transform = `translate(${(cx - goal.cx).toFixed(2)}px, ${(cy - goal.cy).toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
          droplet.style.borderRadius = `${(dropR / sx).toFixed(2)}px / ${(dropR / sy).toFixed(2)}px`;
        }
      }

      const cr = canvas.getBoundingClientRect();
      // the shape, in viewport px, for DotField to draw the glass of
      shape.card = [card.x + cr.left, card.y + cr.top, card.w, card.h];
      shape.drop = [cx + cr.left, cy + cr.top, hw, hh];
      shape.cardR = cardRadius;
      shape.dropR = dropR;
      shape.k = k;
      shape.bubble = broken ? clamp01((t - brokeAt) / 220) : 0;
      shape.stub = [ex + cr.left, ey + cr.top, Math.max(0, stub.x)];
      if (!buds.has(shape)) { buds.add(shape); budsChanged(); }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U("uRes"), box.w, box.h);
      gl.uniform1f(U("uDpr"), dpr);
      gl.uniform2f(U("uPage"), cr.left + window.scrollX, cr.top + window.scrollY);
      gl.uniform4f(U("uCard"), card.x, card.y, card.w, card.h);
      gl.uniform1f(U("uCardR"), cardRadius);
      gl.uniform4f(U("uDrop"), cx, cy, hw, hh);
      gl.uniform1f(U("uDropR"), dropR);
      gl.uniform1f(U("uK"), k);
      gl.uniform3f(U("uStub"), ex, ey, Math.max(0, stub.x));
      gl.uniform3f(U("uHole"), hole.x, hole.y, hole.r);
      gl.uniform1f(U("uBubble"), broken ? clamp01((t - brokeAt) / 220) : 0);
      gl.uniform1f(U("uBubA"), bubA);
      gl.uniform1f(U("uRim"), Math.min(1, t / 120));
      // the card's rim opens round the bud, and closes again as the canvas fades
      if (panel) setRingHole(panel, "b", hole.x - card.x, hole.y - card.y, hole.r * fade);
      gl.uniform1f(U("uAlpha"), fade);
      gl.uniform1f(U("uDark"), dark ? 1 : 0);
      gl.uniform1f(U("uGap"), paper.gap);
      gl.uniform1f(U("uDotR"), paper.dotRadius);
      gl.uniform1f(U("uDotA"), pal.dotAlpha);
      gl.uniform3f(U("uBg"), ...rgb(pal.bg));
      gl.uniform3f(U("uDot"), ...rgb(pal.dot));
      gl.uniform3f(U("uFill"), ...rgb(glass.fill));
      gl.uniform1f(U("uFillA"), glass.alpha);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (fade > 0) schedule();
      else { buds.delete(shape); budsChanged(); setGone(true); }
    };
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      budTicks.delete(frame);
      if (panel) setRingHole(panel as HTMLElement, "b", 0, 0, 0);
      droplet?.remove();
      dropletSvg?.remove();
      if (buds.delete(shape)) budsChanged();
      returnBudGL(b);
    };
  }, [box, bubbleRef, cardRadius, bubbleRadius]);

  if (gone) return null;
  return (
    <div
      ref={holderRef}
      aria-hidden
      style={{
        position: "absolute",
        left: box?.left ?? 0,
        top: box?.top ?? 0,
        width: box?.w ?? 0,
        height: box?.h ?? 0,
        pointerEvents: "none",
      }}
    />
  );
}
