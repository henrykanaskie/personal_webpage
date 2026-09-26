"use client";

import { useEffect, useId, useRef, useState } from "react";

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

export function useGlassLens(ref: React.RefObject<HTMLElement | null>, { radius = 24, strength = 44 } = {}) {
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
  const style: React.CSSProperties = map
    ? { backdropFilter: `url(#${id})`, WebkitBackdropFilter: `url(#${id})` }
    : {};

  return { filter, style };
}

// ─── LiquidBud ──────────────────────────────────────────────────────────────
// A bubble forming from its card, the way the cursor lens used to merge with
// the drifting bubbles: one liquid surface, not two pieces of glass.
//
// The shape is a signed distance field: the card (a rounded box) smoothly
// unioned with a droplet. The droplet starts as nothing on the card's edge,
// swells into a bump, pulls away on a neck that thins as the smooth-union's
// reach is exceeded, pinches off, then grows and wobbles into the bubble's own
// box. Motion is two underdamped springs (position and size) plus squash and
// stretch along the droplet's velocity. Only the part outside the card is
// painted (the card itself is real DOM). When the droplet has settled onto the
// bubble's exact box, the real bubble fades in over it and this canvas goes.

const BUD_VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;
const BUD_FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform vec4 uCard;   // x, y, w, h (css px, canvas space)
uniform float uCardR;
uniform vec4 uDrop;   // cx, cy, half-w, half-h
uniform float uDropR, uK, uAlpha, uDark;
uniform vec3 uFill, uRim;

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
  if (uDrop.z < 0.25) return c;
  return smin(c, sdBox(p, uDrop.xy, uDrop.zw, uDropR), uK);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  float d = scene(p);
  float dc = card(p);
  float aa = 0.8 / uDpr;
  // the card is real DOM: paint only what the liquid adds outside it
  float outside = smoothstep(-aa, aa, dc);
  float cover = (1.0 - smoothstep(-aa, aa, d)) * outside;

  // surface normal from the field, and a dome over the first 16px inside the rim
  vec2 g = vec2(scene(p + vec2(1.0, 0.0)) - scene(p - vec2(1.0, 0.0)), scene(p + vec2(0.0, 1.0)) - scene(p - vec2(0.0, 1.0)));
  vec2 n2 = length(g) > 1e-4 ? normalize(g) : vec2(0.0);
  float rim = 1.0 - clamp(-d / 16.0, 0.0, 1.0);
  vec3 col = uFill;
  // light from the upper left: bright where the surface faces it, soft shade opposite
  float facing = dot(n2, normalize(vec2(-0.55, -0.8)));
  col += (uDark > 0.5 ? 0.16 : 0.1) * rim * max(facing, 0.0);
  col -= (uDark > 0.5 ? 0.05 : 0.07) * rim * max(-facing, 0.0);
  // hairline rim, like the glass panels
  float line = 1.0 - smoothstep(0.0, 1.2, abs(d + 0.6));
  col = mix(col, uRim, line * 0.55);

  // soft shadow on the paper beneath the neck and droplet
  float ds = scene(p - vec2(0.0, 9.0));
  float shadow = (1.0 - smoothstep(-6.0, 22.0, ds)) * (uDark > 0.5 ? 0.35 : 0.14) * outside * (1.0 - cover);

  float a = max(cover, shadow) * uAlpha;
  vec3 outc = cover > shadow ? col : vec3(uDark > 0.5 ? 0.0 : 0.16, uDark > 0.5 ? 0.0 : 0.13, uDark > 0.5 ? 0.0 : 0.1);
  gl_FragColor = vec4(outc * a, a);
}
`;

type Spring = { x: number; v: number };
// Damped harmonic step. zeta < 1 overshoots: that overshoot is the wobble.
function stepSpring(s: Spring, target: number, omega: number, zeta: number, dt: number) {
  const n = 4; // substeps keep it stable at 30fps
  for (let i = 0; i < n; i++) {
    const h = dt / n;
    const acc = -2 * zeta * omega * s.v - omega * omega * (s.x - target);
    s.v += acc * h;
    s.x += s.v * h;
  }
}

// Accepts #rgb, #rrggbb and rgb()/rgba(); anything else falls back to white.
const parseColor = (c: string): [number, number, number] => {
  const hex = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (x) => x + x) : hex[1];
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }
  const m = c.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const [r, g, b] = m[1].split(",").map((x) => parseFloat(x));
    if ([r, g, b].every((x) => Number.isFinite(x))) return [r / 255, g / 255, b / 255];
  }
  return [1, 1, 1];
};

export function LiquidBud({
  bubbleRef,
  radius = 24,
  onDone,
}: {
  /** The bubble, already at its resting position (invisible); its offsetParent is the overlay over the card. */
  bubbleRef: React.RefObject<HTMLElement | null>;
  radius?: number;
  /** Called when the droplet has settled onto the bubble's box. */
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const [box, setBox] = useState<{ left: number; top: number; w: number; h: number } | null>(null);
  const [gone, setGone] = useState(false);

  // Size the canvas to cover the card and the bubble's resting box, plus a margin for the wobble.
  useEffect(() => {
    const bubble = bubbleRef.current;
    const host = bubble?.offsetParent as HTMLElement | null;
    if (!bubble || !host) { doneRef.current(); setGone(true); return; }
    const hr = host.getBoundingClientRect();
    const br = bubble.getBoundingClientRect();
    const M = 60;
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

    // Geometry in canvas space. Everything is measured once: the bubble is already
    // sitting, invisible, exactly where it will end up.
    const hr = host.getBoundingClientRect();
    const br = bubble.getBoundingClientRect();
    const card = { x: -box.left, y: -box.top, w: hr.width, h: hr.height };
    const goal = { cx: br.left - hr.left - box.left + br.width / 2, cy: br.top - hr.top - box.top + br.height / 2, hw: br.width / 2, hh: br.height / 2 };
    // the droplet is born on the card's edge, at the point nearest the bubble
    const sideways = goal.cx > card.x + card.w || goal.cx < card.x;
    const start = sideways
      ? { x: goal.cx > card.x ? card.x + card.w - 6 : card.x + 6, y: Math.min(card.y + card.h - radius * 1.5, Math.max(card.y + radius * 1.5, goal.cy)) }
      : { x: Math.min(card.x + card.w - radius * 1.5, Math.max(card.x + radius * 1.5, goal.cx)), y: goal.cy > card.y ? card.y + card.h - 6 : card.y + 6 };

    const style = getComputedStyle(document.documentElement);
    const dark = document.documentElement.classList.contains("dark");
    const fill = parseColor(style.getPropertyValue("--bud-fill").trim() || (dark ? "rgb(29,31,36)" : "rgb(251,250,247)"));
    const rimC: [number, number, number] = dark ? [0.42, 0.44, 0.48] : [0.62, 0.6, 0.57];

    const px: Spring = { x: start.x, v: 0 }, py: Spring = { x: start.y, v: 0 };
    const sw: Spring = { x: 0, v: 0 }, shh: Spring = { x: 0, v: 0 };
    const t0 = performance.now();
    let last = t0, raf = 0, fade = 1, fading = false;
    const BULGE_MS = 170; // the bump swells in place before it starts to travel

    const frame = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      const t = now - t0;
      const travelling = t > BULGE_MS;
      // size: a bump first, then the full bubble once it's on its way
      const bump = Math.min(goal.hw, goal.hh, 30);
      stepSpring(sw, travelling ? goal.hw : bump, 15, 0.5, dt);
      stepSpring(shh, travelling ? goal.hh : bump, 15, 0.5, dt);
      stepSpring(px, travelling ? goal.cx : start.x, 11, 0.55, dt);
      stepSpring(py, travelling ? goal.cy : start.y, 11, 0.55, dt);

      // squash and stretch along the direction of travel
      const speed = Math.hypot(px.v, py.v);
      const stretch = Math.min(0.28, speed / 2600);
      const ux = speed > 1 ? Math.abs(px.v) / speed : 0, uy = speed > 1 ? Math.abs(py.v) / speed : 0;
      const hw = Math.max(0, sw.x) * (1 + stretch * ux - stretch * 0.6 * uy);
      const hh = Math.max(0, shh.x) * (1 + stretch * uy - stretch * 0.6 * ux);
      // corners: a round droplet while small, the bubble's own radius once full size
      const small = Math.min(hw, hh);
      const k01 = Math.min(1, Math.max(0, (small - 40) / 70));
      const dropR = small * (1 - k01) + Math.min(radius, small) * k01;

      // close enough that the swap to the real bubble can't be seen
      const settled =
        travelling && Math.abs(px.x - goal.cx) < 2 && Math.abs(py.x - goal.cy) < 2 &&
        Math.abs(sw.x - goal.hw) < 2 && Math.abs(shh.x - goal.hh) < 2 && speed < 40;
      if ((settled || t > 1600) && !fading) {
        fading = true;
        doneRef.current(); // the real bubble fades in over the droplet...
      }
      if (fading) fade = Math.max(0, fade - dt / 0.16); // ...as this fades out

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U("uRes"), box.w, box.h);
      gl.uniform1f(U("uDpr"), dpr);
      gl.uniform4f(U("uCard"), card.x, card.y, card.w, card.h);
      gl.uniform1f(U("uCardR"), radius);
      gl.uniform4f(U("uDrop"), px.x, py.x, hw, hh);
      gl.uniform1f(U("uDropR"), dropR);
      // how far the liquid reaches to join card and droplet: generous while the
      // bump forms, then fixed, so the neck thins and pinches as the gap opens
      gl.uniform1f(U("uK"), 34);
      gl.uniform1f(U("uAlpha"), fade);
      gl.uniform1f(U("uDark"), dark ? 1 : 0);
      gl.uniform3f(U("uFill"), fill[0], fill[1], fill[2]);
      gl.uniform3f(U("uRim"), rimC[0], rimC[1], rimC[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (fade > 0) raf = requestAnimationFrame(frame);
      else setGone(true);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [box, bubbleRef, radius]);

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
