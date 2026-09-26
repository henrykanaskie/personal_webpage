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
//   LiquidBud      while a bubble opens, a liquid neck joins it to its card and
//                  stretches until it snaps, like a drop separating. It's the
//                  classic metaball trick (blur the two shapes together, then
//                  threshold the alpha), masked so only the neck between the
//                  card and the bubble is ever painted.

// ─── useGlassLens ───────────────────────────────────────────────────────────

const supportsLens = () =>
  typeof navigator !== "undefined" &&
  // backdrop-filter: url() renders only in Chromium; Safari and Firefox drop it.
  !!(navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands?.some(
    (b) => b.brand === "Chromium" || b.brand === "Google Chrome" || b.brand === "Microsoft Edge",
  );

// Displacement map for a rounded rectangle, encoded as R = x, G = y around 128.
// Near the rim the surface curves away, so the image bends outward along the
// edge normal; across the middle it magnifies gently toward the centre.
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
      const t = Math.min(1, Math.max(0, -sd(x, y) / bevel));
      const rim = (1 - t) * (1 - t);
      const gx = sd(x + 1, y) - sd(x - 1, y);
      const gy = sd(x, y + 1) - sd(x, y - 1);
      const g = Math.hypot(gx, gy) || 1;
      const mx = (-(x - w / 2) / (w / 2)) * 0.3;
      const my = (-(y - h / 2) / (h / 2)) * 0.3;
      const vx = (rim * gx) / g * 0.7 + mx * (1 - rim);
      const vy = (rim * gy) / g * 0.7 + my * (1 - rim);
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
  { radius = 24, strength = 44, frost = "" }: { radius?: number; strength?: number; frost?: string } = {},
) {
  const id = `lens-${useId().replace(/:/g, "")}`;
  const [map, setMap] = useState<{ href: string; w: number; h: number } | null>(null);

  useEffect(() => {
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
      setMap({ href: lensMap(w, h, radius, Math.min(28, Math.min(w, h) / 3)), w, h });
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
        {/* three passes at slightly different strengths: glass disperses colour at its edge */}
        <feDisplacementMap in="SourceGraphic" in2="map" scale={strength} xChannelSelector="R" yChannelSelector="G" result="dR" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale={strength * 1.05} xChannelSelector="R" yChannelSelector="G" result="dG" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale={strength * 1.1} xChannelSelector="R" yChannelSelector="G" result="dB" />
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

// ─── LiquidBud ──────────────────────────────────────────────────────────────
// The info bubble is born out of the side of its card, the way a soap film
// buds: the card's own edge swells, and keeps swelling, into a dome; the dome
// stretches outward and its base draws in to a neck; the neck gives, and the
// bubble bursts free, overshooting in size and wobbling onto its box while the
// card's side snaps back flat with a shiver.
//
// All of it is one signed distance field: the card (a rounded box), smoothly
// unioned with the bubble (and, after the break, a shrinking stub on the card's
// side). The smooth union's reach starts wide, so the first swell is a broad
// bulge of the card itself, and narrows as the bubble pulls away, which is what
// draws the neck in until it pinches. The material is the cards' frosted glass
// (blurred dots bent at the rim, the card fill, a chrome hairline), so the
// swell reads as the card. Only what lies outside the card is painted (the
// card is DOM). When the bubble settles, the real frosted bubble fades in.

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
uniform float uAlpha, uDark;
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
float scene(vec2 p) {
  float c = card(p);
  if (uStub.z > 0.3) c = smin(c, length(p - uStub.xy) - uStub.z, 22.0);
  if (uDrop.z < 0.3) return c;
  return smin(c, sdBox(p, uDrop.xy, uDrop.zw, uDropR), uK);
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
  float aa = 0.8 / uDpr;
  float outside = smoothstep(-aa, aa, card(p));       // the card is DOM
  float cover = (1.0 - smoothstep(-aa, aa, d)) * outside;
  vec4 outc = vec4(0.0);

  // a soft contact shadow under the swell and the bubble
  float sh = smoothstep(18.0, -4.0, scene(p - vec2(0.0, 6.0))) * outside * (1.0 - cover);
  outc = vec4(0.0, 0.0, 0.0, 1.0) * sh * (0.1 + 0.2 * uDark);

  if (cover > 0.0) {
    vec2 g = vec2(scene(p + vec2(1.0, 0.0)) - d, scene(p + vec2(0.0, 1.0)) - d);
    vec2 n = normalize(g + 1e-5);
    float rim = 1.0 - clamp(-d / 26.0, 0.0, 1.0);
    rim *= rim;
    // frosted dots, bent outward at the rim like the cards
    vec3 col = mix(uBg, uDot, frostDots(p + n * rim * 11.0) * uDotA);
    col = mix(col, uFill, uFillA);
    // volume: light from the upper left across the rim, shade low on the right
    float lit = dot(-n, normalize(vec2(-0.6, -0.8)));
    col += vec3(1.0) * rim * max(lit, 0.0) * (0.22 - 0.1 * uDark);
    col *= 1.0 - rim * max(-lit, 0.0) * (0.1 + 0.1 * uDark);
    // chrome hairline
    float line = 1.0 - smoothstep(0.0, 1.2, abs(d + 0.6));
    vec3 rimCol = mix(vec3(1.0), vec3(0.38, 0.36, 0.33), smoothstep(-0.4, 0.6, n.y));
    col = mix(col, rimCol, line * (0.55 - 0.25 * uDark));
    outc = mix(outc, vec4(col, 1.0), cover);
  }
  gl_FragColor = outc * uAlpha;
}
`;

type Spring = { x: number; v: number };
// Damped harmonic step. zeta < 1 overshoots: that overshoot is the wobble.
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
const SWELL_MS = 820;
const NECK_MS = 460;

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
    const l = Math.min(0, br.left - hr.left) - M, t = Math.min(0, br.top - hr.top) - M;
    const r = Math.max(hr.width, br.right - hr.left) + M, b = Math.max(hr.height, br.bottom - hr.top) + M;
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
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { finish(); return; }
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

    // After the break: springs carry the bubble to its box, and the stub on the card's side recoils.
    const px: Spring = { x: 0, v: 0 }, py: Spring = { x: 0, v: 0 };
    const sw: Spring = { x: 0, v: 0 }, shh: Spring = { x: 0, v: 0 };
    const stub: Spring = { x: 0, v: 0 };
    let broken = false;
    const t0 = performance.now();
    let last = t0, raf = 0, fade = 1, fading = false;

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
        }
      } else {
        if (!broken) {
          // the break: the bubble leaves with the speed it had, and the card's
          // side keeps a stub of the bulge that snaps back
          broken = true;
          const out = rb * 1.8;
          px.x = ex + nx * out; py.x = ey + ny * out;
          const v = (rb * 1.55 * 2) / (NECK_MS / 1000); // d/dt of the stretch at its end
          px.v = nx * v; py.v = ny * v;
          sw.x = nx !== 0 ? rb * 1.22 : rb * 0.9; shh.x = nx !== 0 ? rb * 0.9 : rb * 1.22;
          sw.v = shh.v = 0;
          stub.x = rb * 0.55; stub.v = 0;
        }
        // burst: it pops up to size with an overshoot, and wobbles in
        stepSpring(px, goal.cx, 9, 0.52, dt);
        stepSpring(py, goal.cy, 9, 0.52, dt);
        stepSpring(sw, goal.hw, 12, 0.4, dt);
        stepSpring(shh, goal.hh, 12, 0.4, dt);
        stepSpring(stub, 0, 20, 0.3, dt);
        const speed = Math.hypot(px.v, py.v);
        const stretch = Math.min(0.2, speed / 3000);
        const ux = speed > 1 ? Math.abs(px.v) / speed : 0, uy = speed > 1 ? Math.abs(py.v) / speed : 0;
        cx = px.x; cy = py.x;
        hw = Math.max(0, sw.x) * (1 + stretch * ux - stretch * 0.6 * uy);
        hh = Math.max(0, shh.x) * (1 + stretch * uy - stretch * 0.6 * ux);
        k = 16;
        const settled =
          Math.abs(px.x - goal.cx) < 2 && Math.abs(py.x - goal.cy) < 2 &&
          Math.abs(sw.x - goal.hw) < 2 && Math.abs(shh.x - goal.hh) < 2 && speed < 40;
        const tb = t - SWELL_MS - NECK_MS;
        if ((settled || tb > 1800) && !fading) {
          fading = true;
          doneRef.current(); // the frosted bubble fades in over this one...
        }
        if (fading) fade = Math.max(0, fade - dt / 0.3); // ...as this one fades out
      }
      // round while small; the finished bubble's own corners once it's big
      const small = Math.min(hw, hh);
      const k01 = clamp01((small - 50) / 60);
      const dropR = small * (1 - k01) + Math.min(bubbleRadius, small) * k01;

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
