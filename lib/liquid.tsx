"use client";

import { useEffect, useId, useRef, useState } from "react";
import { paper } from "./tokens";

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
function lensMap(w: number, h: number, radius: number, bevel: number): string {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(w, h);
  const r = Math.min(radius, w / 2, h / 2);
  const sd = (px: number, py: number) => {
    const qx = Math.abs(px - w / 2) - w / 2 + r;
    const qy = Math.abs(py - h / 2) - h / 2 + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const x = i + 0.5, y = j + 0.5;
      const t = Math.min(1, Math.max(0, -sd(x, y) / bevel)); // 0 at the rim, 1 past the band
      const u = 1 - t;
      const tilt = 1 - Math.sqrt(Math.max(0, 1 - u * u)); // circular profile
      const gx = sd(x + 1, y) - sd(x - 1, y);
      const gy = sd(x, y + 1) - sd(x, y - 1);
      const g = Math.hypot(gx, gy) || 1;
      // outward normal is (gx, gy); sample inward, against it
      const vx = -(gx / g) * tilt;
      const vy = -(gy / g) * tilt;
      const o = (j * w + i) * 4;
      img.data[o] = 128 + 127 * Math.max(-1, Math.min(1, vx));
      img.data[o + 1] = 128 + 127 * Math.max(-1, Math.min(1, vy));
      img.data[o + 2] = 128;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
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
    const build = () => {
      // offsetWidth/Height ignore transforms, so the scale-in animation doesn't
      // make us rebuild the map every frame.
      const w = el.offsetWidth, h = el.offsetHeight;
      const key = `${w}x${h}`;
      if (!w || !h || key === last) return;
      last = key;
      setMap({ href: lensMap(w, h, radius, Math.min(22, Math.min(w, h) / 4)), w, h });
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(el);
    return () => ro.disconnect();
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
  ring.style.setProperty(`--${which}x`, on ? `${x.toFixed(1)}px` : "-9999px");
  ring.style.setProperty(`--${which}y`, on ? `${y.toFixed(1)}px` : "-9999px");
  ring.style.setProperty(`--${which}r`, on ? `${r.toFixed(1)}px` : "0px");
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

const BUD_VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;
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
uniform float uAlpha, uDark, uTime;
uniform float uGap, uDotR, uDotA;
uniform vec3 uBg, uDot, uFill;
uniform float uFillA;

float sdBox(vec2 p, vec2 c, vec2 hs, float r) {
  vec2 q = abs(p - c) - hs + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
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
float frostDots(vec2 p) {
  vec2 w = p + uPage;
  vec2 c = (floor(w / uGap) + 0.5) * uGap - uPage;
  float d = length(p - c);
  float R = uDotR + 2.6;
  return smoothstep(R, 0.0, d) * 0.6;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  float d = scene(p);
  float dc = card(p);
  float aa = 0.8 / uDpr;
  float outside = smoothstep(-aa, aa, dc);            // the card is DOM
  // Near the bud the canvas also repaints a thin band just inside the card's
  // edge, so the frosted dots there bend with the liquid's outline rather than
  // the card's: no seam where the card ends and the growth begins. Away from
  // the bud the two outlines are the same, so the band fades out unseen.
  float w = uHole.z > 0.5 ? 1.0 - clamp((length(p - uHole.xy) - uHole.z) / 30.0, 0.0, 1.0) : 0.0;
  float band = smoothstep(-18.0, -10.0, dc) * w;
  float inL = 1.0 - smoothstep(-aa, aa, d);
  float cover = inL * max(outside, band);
  vec4 outc = vec4(0.0);

  // a soft contact shadow under the growth and the bubble, like the card's own
  // (wide and faint: a tight one reads as an outline around the droplet)
  float sh = smoothstep(34.0, -12.0, scene(p - vec2(0.0, 10.0))) * outside * (1.0 - inL);
  outc = vec4(0.0, 0.0, 0.0, 1.0) * sh * (0.05 + 0.16 * uDark);

  vec2 g = vec2(scene(p + vec2(1.0, 0.0)) - d, scene(p + vec2(0.0, 1.0)) - d);
  vec2 n = normalize(g + 1e-5);
  // How far the surface has been stretched out of the card: 0 on the card,
  // 1 some way out along the bulge, and 1 for the freed droplet. A stretched
  // film thins, so it turns from the card's frosted surface into the bubble's
  // clear, iridescent one.
  float isDrop = uBubble * smoothstep(1.0, -1.0, drop(p) - cardStub(p));
  float stretch = max(smoothstep(2.0, 38.0, dc), isDrop);
  // thin film colour, the same as the settled bubble's (.glass-bubble::after):
  // pink on the left edge, cyan on the right, violet on top, gold below
  float wl = max(-n.x, 0.0), wr = max(n.x, 0.0), wt = max(-n.y, 0.0), wb = max(n.y, 0.0);
  vec3 film = (vec3(1.0, 0.59, 0.8) * wl + vec3(0.47, 0.8, 1.0) * wr + vec3(0.73, 0.63, 1.0) * wt + vec3(1.0, 0.86, 0.55) * wb) / (wl + wr + wt + wb + 1e-3);

  if (cover > 0.0) {
    float rim = 1.0 - clamp(-d / 26.0, 0.0, 1.0);
    rim *= rim;
    // card material, exactly as the card is drawn (DotField's frost under the card fill)
    vec3 col = mix(uBg, uDot, frostDots(p + n * rim * 11.0) * uDotA);
    col = mix(col, uFill, uFillA);
    vec4 cardM = vec4(col, 1.0);
    // bubble material: a light see-through fill, the film glowing toward the rim
    float f = pow(1.0 - clamp(-d / 14.0, 0.0, 1.0), 2.0);
    float fa = f * (0.1 + 0.04 * uDark);
    vec4 bubM = vec4(vec3(uBubA) + film * fa, uBubA + fa);
    outc = mix(outc, mix(cardM, bubM, stretch), cover);
  }

  // The edge. Cards and bubbles share one glass edge, so around the bud the
  // canvas draws that edge round card and bulge as one outline, and the bubble
  // leaves carrying it.
  float line = 1.0 - smoothstep(0.0, 1.1, abs(d + 0.6));
  float glow = smoothstep(-6.0, -0.5, d) * (1.0 - smoothstep(-0.5, 0.5, d));
  // the glass edge (--edge-lip, --edge-film): a hairline all round, brighter
  // on top, a little on the bottom, and the film band just inside it
  float lipA = mix(0.45 + 0.47 * max(-n.y, 0.0) + 0.22 * max(n.y, 0.0), 0.09 + 0.19 * max(-n.y, 0.0), uDark);
  vec3 rimCol = vec3(1.0);
  // only near the bud: elsewhere the card's own (DOM) edge is still there,
  // and the two hand over across the same 40px falloff the rim's hole uses
  float own = uHole.z > 0.5 ? 1.0 - clamp((length(p - uHole.xy) - uHole.z) / 40.0, 0.0, 1.0) : 0.0;
  float reach = uRim * max(own, smoothstep(0.5, 1.5, dc));
  float rimA = line * lipA * reach;
  float filmA = glow * mix(0.3, 0.27, uDark) * reach;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    const canvas = canvasRef.current;
    const bubble = bubbleRef.current;
    const host = bubble?.offsetParent as HTMLElement | null;
    if (!box || !canvas || !bubble || !host) return;
    const finish = () => { doneRef.current(); setGone(true); };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) { finish(); return; }
    const sh = (type: number, src: string) => {
      const x = gl.createShader(type)!;
      gl.shaderSource(x, src);
      gl.compileShader(x);
      return x;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, BUD_VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, BUD_FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      // a broken shader would otherwise just skip the animation silently
      if (process.env.NODE_ENV !== "production") console.error("LiquidBud shader:", gl.getProgramInfoLog(prog));
      finish();
      return;
    }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);

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
    // The card keeps its own (DOM) rim; around the bud it's opened
    // (setRingHole) and the canvas draws the edge there instead, round card
    // and bulge as one shape, handing over across the same falloff.

    // After the break: springs carry the bubble to its box, and the stub on the card's side recoils.
    const flight: Spring = { x: 0, v: 0 };
    const from = { cx: 0, cy: 0, hw: 0, hh: 0 };
    const stub: Spring = { x: 0, v: 0 };
    let broken = false;
    let brokeAt = 0;
    const t0 = performance.now();
    let last = t0, raf = 0, fade = 1, fading = false, fadeAt = 0;

    const frame = (now: number) => {
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

      const cr = canvas.getBoundingClientRect();
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
      if (panel) setRingHole(panel as HTMLElement, "b", hole.x - card.x, hole.y - card.y, hole.r * fade);
      gl.uniform1f(U("uTime"), t / 1000);
      gl.uniform1f(U("uAlpha"), fade);
      gl.uniform1f(U("uDark"), dark ? 1 : 0);
      gl.uniform1f(U("uGap"), paper.gap);
      gl.uniform1f(U("uDotR"), paper.dotRadius);
      gl.uniform1f(U("uDotA"), pal.dotAlpha);
      gl.uniform3f(U("uBg"), pal.bg[0] / 255, pal.bg[1] / 255, pal.bg[2] / 255);
      gl.uniform3f(U("uDot"), pal.dot[0] / 255, pal.dot[1] / 255, pal.dot[2] / 255);
      gl.uniform3f(U("uFill"), glass.fill[0] / 255, glass.fill[1] / 255, glass.fill[2] / 255);
      gl.uniform1f(U("uFillA"), glass.alpha);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (fade > 0) raf = requestAnimationFrame(frame);
      else setGone(true);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      if (panel) setRingHole(panel as HTMLElement, "b", 0, 0, 0);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [box, bubbleRef, cardRadius, bubbleRadius]);

  if (gone) return null;
  return (
    <canvas
      ref={canvasRef}
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
