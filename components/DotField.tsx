"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { paper } from "@/lib/tokens";
import { buds, onBudsChange, setRingHole } from "@/lib/liquid";
import { GLSL_GLASS, fullscreenProgram, rgb, uniforms } from "@/lib/gl";
import { type Drawing, allDrawings, onDrawingsChange } from "@/lib/drawings";

// ─── DotField ───────────────────────────────────────────────────────────────
// The page's dot grid, redrawn in WebGL as one fixed backdrop behind every CS
// page, so it can move:
//   - dots swell and part around the cursor
//   - on every navigation the grid configures itself in a wave, starting from
//     wherever you clicked to get there
//   - a click on bare paper sends a ripple through the dots
//   - under every card ([data-liquid]) the dots are seen through the info
//     bubbles' glass: blurred, lensed at the rim, lifted (glassSurface, lib/gl)
//   - a bubble budding off a card is glass drawn here too (BudShape in
//     lib/liquid), so the drawings bend through the bulge as it grows
//   - the line drawings, once drawn, are painted here too (lib/drawings), so
//     the glass frosts and bends them exactly as it does the dots
//   - a card is liquid: as the cursor comes near, its edge swells and reaches
//     toward it on a critically damped spring, and settles back when the cursor leaves
//
// Dots are drawn in page space at exactly the positions of the CSS dots
// (lib/tokens `paper`), so there's no seam when the canvas appears, and if
// WebGL is missing the CSS grid is simply what you see.
//
// Cost: every pixel evaluates one grid cell. Per-dot movement is capped so a
// dot can never leave its own cell, which is what makes a single evaluation
// exact. Resolution steps down on its own if frames run long, and the loop
// stops entirely once nothing is moving.

// The drawings are read with an explicit mip level (EXT_shader_texture_lod):
// a plain texture2D takes its level from screen derivatives, which makes
// compilers run it outside the branch that should skip it, so every pixel on
// screen paid for every drawing. Without the extension the drawings stay DOM.
const FRAG = (lod: boolean) => `${lod ? "#extension GL_EXT_shader_texture_lod : enable\n#define TEXL(t, uv, l) texture2DLodEXT(t, uv, l)" : "#define TEXL(t, uv, l) vec4(0.0)"}
precision highp float;
uniform vec2 uRes;        // css px
uniform float uDpr;
uniform vec2 uScroll;     // page position of the viewport's top-left
uniform float uGap, uDotR;
uniform vec3 uBg, uDot;
uniform float uDotA;
uniform vec2 uMouse;      // css px, viewport
uniform float uMouseOn;
uniform vec3 uRipple;     // x, y (viewport), seconds since click
uniform vec2 uOrigin;     // intro wave origin (viewport)
uniform float uIntro;     // seconds since the last navigation
uniform vec4 uCards[8];   // x, y, w, h (viewport) of the visible cards
uniform vec2 uCardP[8];   // corner radius, opacity
uniform float uNCards;
uniform vec3 uBlob;       // the swell a card grows toward the cursor: x, y, radius
uniform float uHoleR;     // radius of the hole opened in that card's rim (centred on the blob)
uniform vec3 uFill;
uniform float uFillA;
uniform float uDark;
// the line drawings (lib/drawings): up to four textures, each mapped from
// viewport px to its uv by two affine rows
uniform sampler2D uDraw0, uDraw1, uDraw2, uDraw3;
uniform vec3 uDrawA[4];
uniform vec3 uDrawB[4];
uniform float uNDraw;
// the buds (lib/liquid BudShape): card, drop, (card radius, drop radius, union reach, freed), stub
uniform vec4 uBudC[2];
uniform vec4 uBudD[2];
uniform vec4 uBudP[2];
uniform vec4 uBudS[2];
uniform float uNBud;
uniform float uDrawL[4];   // each drawing's own mip level at this size (texels per device px)
${GLSL_GLASS}
// One drawing at p, premultiplied, sharp or blurred (below). Only pixels
// inside a drawing's box read its texture at all.
vec4 drawOne(sampler2D t, vec3 A, vec3 B, float base, vec2 p, float blur) {
  vec2 uv = vec2(dot(A, vec3(p, 1.0)), dot(B, vec3(p, 1.0)));
  if (uv.x < -0.02 || uv.y < -0.02 || uv.x > 1.02 || uv.y > 1.02) return vec4(0.0);
  if (blur < 0.01) return TEXL(t, uv, max(0.0, base));
  // Four reads on the diagonals at sigma/sqrt2, each from a mip level about
  // as soft (a trilinear read at level L spreads about 2^L / 2 texels), so
  // they merge into one Gaussian of sigma = blur css px (the bubbles' frost):
  // no ghosted double lines, no mip blockiness.
  vec2 ex = vec2(A.x, B.x) * blur * 0.707, ey = vec2(A.y, B.y) * blur * 0.707;
  float lod = max(0.0, base + log2(blur * 1.414 * uDpr));
  return (TEXL(t, uv + ex + ey, lod) + TEXL(t, uv + ex - ey, lod)
    + TEXL(t, uv - ex + ey, lod) + TEXL(t, uv - ex - ey, lod)) * 0.25;
}
vec4 over(vec4 top, vec4 under) { return top + under * (1.0 - top.a); }
vec4 drawings(vec2 p, float blur) {
  vec4 c = vec4(0.0);
  if (uNDraw > 0.5) c = drawOne(uDraw0, uDrawA[0], uDrawB[0], uDrawL[0], p, blur);
  if (uNDraw > 1.5) c = over(drawOne(uDraw1, uDrawA[1], uDrawB[1], uDrawL[1], p, blur), c);
  if (uNDraw > 2.5) c = over(drawOne(uDraw2, uDrawA[2], uDrawB[2], uDrawL[2], p, blur), c);
  if (uNDraw > 3.5) c = over(drawOne(uDraw3, uDrawA[3], uDrawB[3], uDrawL[3], p, blur), c);
  return c;
}
// The cards alone (what the DOM draws) and the liquid (cards plus the swell).
float cards(vec2 p, out float alpha) {
  float d = 1e5;
  alpha = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uNCards) break;
    vec4 c = uCards[i];
    float di = sdBox(p, c.xy + c.zw * 0.5, c.zw * 0.5, uCardP[i].x);
    if (di < d) { d = di; alpha = uCardP[i].y; }
  }
  return d;
}
float liquid(vec2 p, float dc) {
  if (uBlob.z < 0.5) return dc;
  return smin(dc, length(p - uBlob.xy) - uBlob.z, 38.0);
}
// The buds: the same field LiquidBud's canvas draws (card, recoil stub and
// drop under a smooth union). gw is how much of the glass here is drawn by
// this canvas: all of it, except the freed drop, which the droplet's own DOM
// lens has taken over.
float budGlass(vec2 p, out float gw) {
  float d = 1e5;
  gw = 1.0;
  for (int i = 0; i < 2; i++) {
    if (float(i) >= uNBud) break;
    vec4 C = uBudC[i], D = uBudD[i], P = uBudP[i], S = uBudS[i];
    float c = sdBox(p, C.xy + C.zw * 0.5, C.zw * 0.5, P.x);
    if (S.z > 0.3) c = smin(c, length(p - S.xy) - S.z, 22.0);
    float sc = c, freed = 0.0;
    if (D.z > 0.3) {
      float dd = sdBox(p, D.xy, D.zw, P.y);
      sc = smin(c, dd, P.z);
      freed = P.w * smoothstep(1.0, -1.0, dd - c);
    }
    if (sc < d) { d = sc; gw = 1.0 - freed; }
  }
  return d;
}
// The whole glass outline: the cards with their swell, and the buds.
float glassD(vec2 p, float dc, out float gw) {
  float dl = liquid(p, dc);
  if (uNBud < 0.5) { gw = 1.0; return dl; }
  float db = budGlass(p, gw);
  if (dl <= db) gw = 1.0;
  return min(dl, db);
}

float dots(vec2 p) {
  vec2 w = p + uScroll;
  vec2 c = (floor(w / uGap) + 0.5) * uGap - uScroll;
  float r = uDotR;
  vec2 shift = vec2(0.0);

  // cursor: nearby dots swell and step aside
  vec2 tm = c - uMouse;
  float dm = length(tm);
  float near = exp(-dm * dm / (2.0 * 80.0 * 80.0)) * uMouseOn;
  r += 1.2 * near;
  shift += (dm > 0.5 ? tm / dm : vec2(0.0)) * 6.0 * near;

  // intro: a wave from the origin; each dot arrives a little large, then settles
  float dO = length(c - uOrigin);
  float k = clamp((uIntro - dO / 1500.0) / 0.5, 0.0, 1.0);
  float grow = 1.0 - (1.0 - k) * (1.0 - k) * (1.0 - k);
  r = r * grow + sin(3.14159 * k) * 0.8;
  shift -= (dO > 0.5 ? (c - uOrigin) / dO : vec2(0.0)) * 6.0 * (1.0 - grow);

  // click ripple
  if (uRipple.z >= 0.0 && uRipple.z < 1.6) {
    vec2 dv = c - uRipple.xy;
    float dr = length(dv);
    float front = dr - 700.0 * uRipple.z;
    float amp = exp(-front * front / 1800.0) * exp(-uRipple.z * 1.8);
    r += 1.3 * amp;
    shift += (dr > 0.5 ? dv / dr : vec2(0.0)) * 5.0 * amp;
  }

  // A dot may never leave its cell (half-gap 12px): shift <= 6.5, r <= ~4.5.
  float sl = length(shift);
  if (sl > 6.5) shift *= 6.5 / sl;

  float d = length(p - (c + shift));
  float aa = 0.55 / uDpr + 0.2;
  return smoothstep(r + aa, r - aa, d);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  // Cost matters: this runs for every pixel on screen, every frame anything
  // moves. So the card work is tiered. Deep inside a card (well past the rim
  // band) the page is just the glass, flat: no rim normal, no edge, and none of
  // the cursor/ripple dot work underneath, since the card covers it.
  float ca = 0.0;
  float dc = 1e5;
  if (uNCards > 0.5) dc = cards(p, ca);
  if (dc < -30.0 && ca > 0.99 && (uBlob.z < 0.5 || length(p - uBlob.xy) > uBlob.z + 70.0)) {
    // the same glass as the rim path below, flat here (past the lens bevel),
    // with the tail of the rim's inner light, so there's no step at the tier
    gl_FragColor = vec4(mix(glassSurface(p, uScroll, dc, vec2(0.0)), vec3(1.0), glassGlow(dc)), 1.0);
    return;
  }
  vec3 col = mix(uBg, uDot, dots(p) * uDotA);
  // the drawings on bare paper, sharp
  vec4 dr = drawings(p, 0.0);
  col = col * (1.0 - dr.a) + dr.rgb;

  if (uNCards > 0.5) {
    // dl: the cards and their swell (whose rim this canvas draws); dg: the
    // whole glass outline, buds included (a bud's rim is its own canvas's)
    float dl = liquid(p, dc);
    float gw, gw1, gw2;
    float dg = glassD(p, dc, gw);
    if (dg < 2.5 && ca > 0.01) {
      float aa = 0.7 / uDpr;
      // rim normal of the glass, and how close to the rim we are
      float t1, t2;
      float gx = glassD(p + vec2(1.0, 0.0), cards(p + vec2(1.0, 0.0), t1), gw1) - dg;
      float gy = glassD(p + vec2(0.0, 1.0), cards(p + vec2(0.0, 1.0), t2), gw2) - dg;
      vec2 n = normalize(vec2(gx, gy) + 1e-5);
      // the page under the glass (the dots and the drawings): blurred, lensed
      // at the rim of the glass outline (so the refraction follows a swell or a
      // bud as it grows), and lifted, as through a bubble; the rim's inner light over them
      vec3 frost = glassSurface(p, uScroll, dg, n);
      float inLiquid = 1.0 - smoothstep(-aa, aa, dg);
      // The swell's fill tucks 0.75px under the card: the DOM fill snaps to
      // device pixels on its own, and without the overlap a sliver of bare
      // paper shows between them as a line across the swell's base. Outside
      // the swell the card's lip hairline covers the overlap.
      float outCard = smoothstep(-aa, aa, dc + 0.75);
      // where the liquid reaches past the DOM card, paint the card's fill too
      vec3 swell = mix(frost, uFill, uFillA);
      vec3 inside = mix(mix(frost, swell, outCard), vec3(1.0), glassGlow(dg));
      col = mix(col, inside, inLiquid * ca * gw);
      // the rim's hole (same falloff as .ring-mask): 0 in the hole around a
      // swell, 1 away from it
      float ringVis = uHoleR > 0.5 ? clamp((length(p - uBlob.xy) - uHoleR) / 14.0, 0.0, 1.0) : 1.0;
      // The rim of the whole liquid outline, just outside it: along the swell,
      // and along the card's edge inside the hole opened in the card's own rim,
      // so the border molds into the swell.
      float lineW = max(smoothstep(0.5, 1.5, dc) * (1.0 - smoothstep(-0.5, 0.5, dl - 1.5)), 1.0 - ringVis);
      // the glass edge (--edge-lip, --edge-film in globals.css): a white
      // hairline, brighter on top, with the thin film just inside it
      float line = (1.0 - smoothstep(0.0, 1.0, abs(dl - 0.4))) * lineW;
      float band = smoothstep(-6.0, -0.5, dl) * (1.0 - smoothstep(-0.5, 0.5, dl)) * lineW;
      col = mix(col, edgeFilm(n), band * ca * edgeFilmA(uDark));
      col = mix(col, vec3(1.0), line * ca * edgeLip(n, uDark));
    }
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

// Critically damped spring, stepped per frame.
function springTo(pos: number, vel: number, target: number, omega: number, dt: number) {
  const x = pos - target;
  const e = Math.exp(-omega * dt);
  return [target + (x + (vel + omega * x) * dt) * e, (vel - omega * (vel + omega * x) * dt) * e];
}

// A click on any of these is a click on content, not on the paper: no ripple.
const CONTENT = ".glass-panel, .metal-surface, a, button, img, input, textarea, p, h1, h2, h3, h4, li";

export default function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  // Photography has its own darkroom backdrop; the drafting sheet stays out of it.
  const enabled = !pathname?.startsWith("/photography");
  const waveRef = useRef<(x?: number, y?: number) => void>(() => {});
  const lastDown = useRef<{ x: number; y: number; t: number } | null>(null);

  // Every navigation replays the configure wave, from where the click happened.
  useEffect(() => {
    const d = lastDown.current;
    if (d && performance.now() - d.t < 2500) waveRef.current(d.x, d.y);
    else waveRef.current();
  }, [pathname]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!enabled || !el) return;
    const canvas: HTMLCanvasElement = el;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "low-power" });
    if (!gl) return;

    // explicit mip levels for the drawings; without them the drawings stay DOM
    const texLod = !!gl.getExtension("EXT_shader_texture_lod");
    const prog = fullscreenProgram(gl, FRAG(texLod));
    if (!prog) return; // the CSS dots stay
    // prettier-ignore
    const u = uniforms(gl, prog, [
      "uRes", "uDpr", "uScroll", "uGap", "uDotR", "uBg", "uDot", "uDotA", "uMouse", "uMouseOn",
      "uRipple", "uOrigin", "uIntro", "uCards", "uCardP", "uNCards", "uBlob", "uHoleR", "uFill", "uFillA", "uDark",
      "uDraw0", "uDraw1", "uDraw2", "uDraw3", "uDrawA", "uDrawB", "uDrawL", "uNDraw",
      "uBudC", "uBudD", "uBudP", "uBudS", "uNBud",
    ]);
    const cardBuf = new Float32Array(32), cardPBuf = new Float32Array(16);
    let panels: HTMLElement[] = [];
    let panelsAt = -1e9;
    const radiusOf = new WeakMap<HTMLElement, number>();
    let lastSig = "";
    // The swell: a blob that rises out of the nearest card's edge toward the cursor.
    const blob = { x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0 };
    let holeEl: HTMLElement | null = null;

    // Opacity from inline styles up the tree (Framer Motion writes it there), so
    // the frost appears with its card rather than before it.
    const opacityOf = (el: HTMLElement) => {
      let a = 1;
      let e: HTMLElement | null = el;
      for (let i = 0; i < 6 && e; i++, e = e.parentElement) {
        const o = e.style.opacity;
        if (o !== "") a *= parseFloat(o);
      }
      return a;
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0, last = performance.now();
    let slowMs = 0;
    let lastScrollY = window.scrollY, lastActive = last;
    let wasDark = document.documentElement.classList.contains("dark");

    // Plain fields and plain assignments throughout: the production minifier
    // constant-folds `[obj.a, obj.b] = f()` on objects like these into `[0, 0] = f()`.
    const mouse = { x: -9999, y: -9999, on: 0, onV: 0 };
    let ripple = { x: 0, y: 0, t: -1 };
    let wave = { x: 0, y: 0, start: reduced ? -99 : last };
    waveRef.current = (x, y) => {
      if (reduced) return;
      wave = { x: x ?? w / 2, y: y ?? h * 0.4, start: performance.now() };
      wake();
    };

    // The canvas is sized to the large viewport (100lvh, .dot-field), so iOS
    // Safari's toolbar collapsing on scroll doesn't resize (and reallocate) it
    // mid-scroll; it only grows, or changes on a real width change.
    let lost = false;
    const resize = () => {
      dpr = Math.min(dpr, Math.min(window.devicePixelRatio || 1, 2));
      const nw = canvas.clientWidth || window.innerWidth;
      const nh = Math.max(canvas.clientHeight || 0, window.innerHeight);
      if (nw === w && nh <= h) return;
      h = nw !== w ? nh : Math.max(h, nh);
      w = nw;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      wave.x ||= w / 2;
      wave.y ||= h * 0.4;
      wake();
    };
    resize();
    window.addEventListener("resize", resize);

    // Touch has no hover, so a finger stands in for the cursor while it's down:
    // the dots part under it and a card's edge reaches toward it.
    let touching = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && !touching) return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      wake();
    };
    const onLeave = () => { mouse.x = -9999; wake(); };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      touching = false;
      mouse.x = -9999;
      wake();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        touching = true;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
      lastDown.current = { x: e.clientX, y: e.clientY, t: performance.now() };
      const t = e.target as Element | null;
      if (!(t && t.closest?.(CONTENT))) ripple = { x: e.clientX, y: e.clientY, t: 0 };
      wake();
    };
    const onScroll = () => wake();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    // iOS drops WebGL contexts under memory pressure or in the background. The
    // canvas hides and the CSS dot grid underneath is simply what's seen.
    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.style.opacity = "0";
      showAll();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    document.documentElement.addEventListener("pointerleave", onLeave);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    // A theme switch repaints the paper even if nothing else is moving.
    const themeObs = new MutationObserver(() => wake());
    // The drawings (lib/drawings): one texture each, re-uploaded when the theme
    // or its image changes. A drawing's SVG is hidden only while it's painted here.
    const drawTex = new Map<Drawing, { tex: WebGLTexture; key: string }>();
    const drawBufA = new Float32Array(12), drawBufB = new Float32Array(12), drawBufL = new Float32Array(4);
    const hidden = new Set<Drawing>();
    let lastDrawSig = "";
    const setHidden = (d: Drawing, on: boolean) => {
      if (on === hidden.has(d)) return;
      if (on) hidden.add(d); else hidden.delete(d);
      d.svg.style.visibility = on ? "hidden" : "";
    };
    const showAll = () => { for (const d of Array.from(hidden)) setHidden(d, false); };
    const offDrawings = onDrawingsChange(() => wake());
    // a bud starting (or ending) wakes the loop; it stays awake while any grows
    const offBuds = onBudsChange(() => wake());
    const budBuf = { c: new Float32Array(8), d: new Float32Array(8), p: new Float32Array(8), s: new Float32Array(8) };
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    function wake() {
      lastActive = performance.now();
      if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }

    function frame(now: number) {
      raf = 0;
      if (document.hidden || !gl || lost) return;
      const scrollY = window.scrollY;
      const scrolling = scrollY !== lastScrollY;
      lastScrollY = scrollY;
      const dark = document.documentElement.classList.contains("dark");
      const themeChanged = dark !== wasDark;
      wasDark = dark;
      const introT = (now - wave.start) / 1000;
      const settling = Math.abs(mouse.onV) > 1e-3 || Math.abs(mouse.on - (mouse.x > -9000 ? 1 : 0)) > 1e-3;
      let busy = scrolling || themeChanged || settling || ripple.t >= 0 || introT < 2.2 || now - lastActive < 250 || buds.size > 0;

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Adaptive resolution: if busy frames keep running long, step the pixel ratio down.
      if (busy && dt > 0.024) slowMs += dt * 1000; else slowMs = Math.max(0, slowMs - dt * 500);
      if (slowMs > 600 && dpr > 1) {
        dpr = Math.max(1, dpr - 0.25);
        slowMs = 0;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      const pal = dark ? paper.dark : paper.light;
      const glass = dark ? paper.glass.dark : paper.glass.light;

      // Visible cards, nearest first.
      if (now - panelsAt > 1000) {
        panels = Array.from(document.querySelectorAll<HTMLElement>("[data-liquid]"));
        panelsAt = now;
      }
      let n = 0;
      let sig = "";
      let near: { d: number; ex: number; ey: number; nx: number; ny: number; el: HTMLElement; left: number; top: number } | null = null;
      for (const el of panels) {
        if (n >= 8) break;
        const r = el.getBoundingClientRect();
        if (r.bottom < -40 || r.top > h + 40 || r.width < 1) continue;
        let rad = radiusOf.get(el);
        if (rad === undefined) {
          rad = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
          radiusOf.set(el, rad);
        }
        const a = opacityOf(el);
        cardBuf[n * 4] = r.left; cardBuf[n * 4 + 1] = r.top; cardBuf[n * 4 + 2] = r.width; cardBuf[n * 4 + 3] = r.height;
        cardPBuf[n * 2] = Math.min(rad, r.width / 2, r.height / 2); cardPBuf[n * 2 + 1] = a;
        sig += `${r.left | 0},${r.top | 0},${r.width | 0},${r.height | 0},${a.toFixed(2)};`;
        n++;
        // distance from the cursor to this card's edge, and the edge point nearest it
        if (mouse.x > -9000 && a > 0.9) {
          const ex = Math.max(r.left, Math.min(r.right, mouse.x));
          const ey = Math.max(r.top, Math.min(r.bottom, mouse.y));
          const d = Math.hypot(mouse.x - ex, mouse.y - ey);
          if (d > 0 && (!near || d < near.d)) near = { d, ex, ey, nx: (mouse.x - ex) / d, ny: (mouse.y - ey) / d, el, left: r.left, top: r.top };
        }
      }
      const moved = sig !== lastSig;
      lastSig = sig;

      // The swell reaches about halfway to the cursor and grows as it closes in.
      // Critically damped, like everything else that moves: it rises and lets
      // go without a wobble, and its radius can't overshoot past zero and pop
      // back up after the cursor leaves.
      const REACH = 120;
      let tx = blob.x, ty = blob.y, tr = 0;
      if (near && near.d < REACH && !reduced) {
        const k = 1 - near.d / REACH;
        tr = 10 + 26 * k;
        // never so far out that the smooth union lets go: it reaches, it doesn't drip
        const out = Math.min(near.d * 0.6, tr * 0.6 + 8);
        tx = near.ex + near.nx * out;
        ty = near.ey + near.ny * out;
        if (blob.r < 0.5) { blob.x = near.ex - near.nx * 20; blob.y = near.ey - near.ny * 20; blob.vx = blob.vy = 0; }
      }
      let sb = springTo(blob.x, blob.vx, tx, 14, dt);
      blob.x = sb[0]; blob.vx = sb[1];
      sb = springTo(blob.y, blob.vy, ty, 14, dt);
      blob.y = sb[0]; blob.vy = sb[1];
      sb = springTo(blob.r, blob.vr, tr, 14, dt);
      blob.r = Math.max(0, sb[0]); blob.vr = sb[1];
      const blobBusy = Math.abs(blob.vr) > 0.5 || Math.abs(blob.r - tr) > 0.3 || Math.hypot(blob.vx, blob.vy) > 2;
      if (moved || blobBusy) { lastActive = now; busy = true; }

      // Open the card's rim around the swell (the shader draws the rim there instead).
      const holeR = blob.r > 0.5 ? blob.r + 34 : 0;
      if (near && near.el !== holeEl && holeEl) setRingHole(holeEl, "s", 0, 0, 0);
      if (near) {
        holeEl = near.el;
        setRingHole(near.el, "s", blob.x - near.left, blob.y - near.top, holeR);
      } else if (holeEl) {
        // the cursor left: keep following the swell as it settles back on the last card
        const r = holeEl.getBoundingClientRect();
        setRingHole(holeEl, "s", blob.x - r.left, blob.y - r.top, holeR);
        if (holeR === 0) holeEl = null;
      }
      const sp = springTo(mouse.on, mouse.onV, mouse.x > -9000 ? 1 : 0, 9, dt);
      mouse.on = sp[0];
      mouse.onV = sp[1];
      if (ripple.t >= 0) { ripple.t += dt; if (ripple.t > 1.6) ripple.t = -1; }

      // The drawings on screen (at most four): where each sits, as the affine
      // map from viewport px to its image's uv (the inverse of its screen CTM).
      let nd = 0;
      let dsig = "";
      const theme = dark ? "dark" : "light";
      for (const d of allDrawings()) {
        const img = d.images[theme];
        const m = texLod && nd < 4 && img && d.svg.isConnected ? d.svg.getScreenCTM() : null;
        let on = false;
        if (m && img) {
          const b = d.box;
          const xs = [b.x, b.x + b.w], ys = [b.y, b.y + b.h];
          let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
          for (const x of xs) for (const y of ys) {
            const px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f;
            x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
          }
          if (x1 > -40 && x0 < w + 40 && y1 > -40 && y0 < h + 40) {
            const key = `${theme}:${d.version}`;
            let t = drawTex.get(d);
            if (!t || t.key !== key) {
              const tex = t?.tex ?? gl.createTexture();
              if (tex) {
                gl.activeTexture(gl.TEXTURE0 + nd);
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                t = { tex, key };
                drawTex.set(d, t);
              }
            }
            if (t) {
              gl.activeTexture(gl.TEXTURE0 + nd);
              gl.bindTexture(gl.TEXTURE_2D, t.tex);
              const inv = new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]).inverse();
              drawBufA.set([inv.a / b.w, inv.c / b.w, (inv.e - b.x) / b.w], nd * 3);
              // its own mip level: texels per device px at its current size
              drawBufL[nd] = Math.log2(img.width / (b.w * Math.hypot(m.a, m.b) * (canvas.width / w)));
              drawBufB.set([inv.b / b.h, inv.d / b.h, (inv.f - b.y) / b.h], nd * 3);
              dsig += `${m.a.toFixed(3)},${m.e | 0},${m.f | 0};`;
              nd++;
              on = true;
            }
          }
        }
        setHidden(d, on);
      }
      for (const [d, t] of drawTex) if (!allDrawings().has(d)) { gl.deleteTexture(t.tex); drawTex.delete(d); hidden.delete(d); }
      // a drawing that moves without a scroll (a card rising into place) keeps the loop awake
      if (dsig !== lastDrawSig) { lastDrawSig = dsig; lastActive = now; busy = true; }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.uRes, w, h);
      gl.uniform1f(u.uDpr, canvas.width / w);
      gl.uniform2f(u.uScroll, window.scrollX, scrollY);
      gl.uniform1f(u.uGap, paper.gap);
      gl.uniform1f(u.uDotR, paper.dotRadius);
      gl.uniform3f(u.uBg, ...rgb(pal.bg));
      gl.uniform3f(u.uDot, ...rgb(pal.dot));
      gl.uniform1f(u.uDotA, pal.dotAlpha);
      gl.uniform2f(u.uMouse, mouse.x, mouse.y);
      gl.uniform1f(u.uMouseOn, Math.max(0, mouse.on));
      gl.uniform3f(u.uRipple, ripple.x, ripple.y, ripple.t);
      gl.uniform2f(u.uOrigin, wave.x, wave.y);
      gl.uniform1f(u.uIntro, introT);
      gl.uniform4fv(u.uCards, cardBuf);
      gl.uniform2fv(u.uCardP, cardPBuf);
      gl.uniform1f(u.uNCards, n);
      gl.uniform3f(u.uBlob, blob.x, blob.y, Math.max(0, blob.r));
      gl.uniform1f(u.uHoleR, holeR);
      gl.uniform3f(u.uFill, ...rgb(glass.fill));
      gl.uniform1f(u.uFillA, glass.alpha);
      gl.uniform1f(u.uDark, dark ? 1 : 0);
      gl.uniform1i(u.uDraw0, 0);
      gl.uniform1i(u.uDraw1, 1);
      gl.uniform1i(u.uDraw2, 2);
      gl.uniform1i(u.uDraw3, 3);
      gl.uniform3fv(u.uDrawA, drawBufA);
      gl.uniform3fv(u.uDrawB, drawBufB);
      gl.uniform1fv(u.uDrawL, drawBufL);
      gl.uniform1f(u.uNDraw, nd);
      let nb = 0;
      for (const bd of buds) {
        if (nb >= 2) break;
        budBuf.c.set(bd.card, nb * 4);
        budBuf.d.set(bd.drop, nb * 4);
        budBuf.p.set([bd.cardR, bd.dropR, Math.max(0.5, bd.k), bd.bubble], nb * 4);
        budBuf.s.set([...bd.stub, 0], nb * 4);
        nb++;
      }
      gl.uniform4fv(u.uBudC, budBuf.c);
      gl.uniform4fv(u.uBudD, budBuf.d);
      gl.uniform4fv(u.uBudP, budBuf.p);
      gl.uniform4fv(u.uBudS, budBuf.s);
      gl.uniform1f(u.uNBud, nb);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.style.opacity = "1";

      // With nothing moving, the last frame stays on screen and the loop sleeps
      // until the next scroll, pointer move, click, resize or theme change.
      if (busy) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      themeObs.disconnect();
      offDrawings();
      offBuds();
      showAll();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("scroll", onScroll);
      canvas.removeEventListener("webglcontextlost", onLost);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <canvas ref={canvasRef} aria-hidden className="dot-field" style={{ opacity: 0 }} />
  );
}
