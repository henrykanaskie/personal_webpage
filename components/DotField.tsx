"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { frame as motionFrame, cancelFrame, type FrameData } from "framer-motion";
import { paper } from "@/lib/tokens";
import { budTicks, buds, glassDriver, onBudsChange, releaseBuds, setRingHole, stepBuds } from "@/lib/liquid";
import { GLSL_GLASS, compileFullscreen, rgb, uniforms } from "@/lib/gl";
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
uniform float uMargin;    // the canvas reaches this far above and below the viewport (css px)
uniform float uGap, uDotR;
uniform vec3 uBg, uDot;
uniform float uDotA;
uniform vec2 uMouse;      // css px, viewport
uniform float uMouseOn;
uniform vec3 uRipple;     // x, y (viewport), seconds since click
uniform vec2 uOrigin;     // intro wave origin (viewport)
uniform float uIntro;     // seconds since the last navigation
uniform vec4 uCards[8];   // x, y, w, h (viewport) of the visible cards
uniform vec3 uCardP[8];   // corner radius, opacity, whose glass: this canvas's (1) or the browser's (0)
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
uniform float uDrawO[4];   // and its opacity (its wrapper fades with its card)
${GLSL_GLASS}
// One drawing at p, premultiplied. Only pixels inside a drawing's box read
// its texture at all. Sharp and frosted reads are separate functions, so each
// call site carries only the reads it uses (the shader's size is what the GPU
// compiles before the first frame).
vec2 drawUV(vec3 A, vec3 B, vec2 p) { return vec2(dot(A, vec3(p, 1.0)), dot(B, vec3(p, 1.0))); }
bool offBox(vec2 uv) { return uv.x < -0.02 || uv.y < -0.02 || uv.x > 1.02 || uv.y > 1.02; }
// sharp: the full-resolution image (the texture holds up to 2x the screen's
// pixels, from rounding to a power of two, so its own level would blend in
// the next, softer one)
vec4 drawSharp(sampler2D t, vec3 A, vec3 B, float base, vec2 p) {
  vec2 uv = drawUV(A, B, p);
  if (offBox(uv)) return vec4(0.0);
  return TEXL(t, uv, max(0.0, base - 1.0));
}
// Frosted: four reads on the diagonals at sigma/sqrt2, each from a mip level
// about as soft (a trilinear read at level L spreads about 2^L / 2 texels),
// so they merge into one Gaussian of sigma = blur css px (the bubbles'
// frost): no ghosted double lines, no mip blockiness.
vec4 drawFrost(sampler2D t, vec3 A, vec3 B, float base, vec2 p, float blur) {
  vec2 uv = drawUV(A, B, p);
  if (offBox(uv)) return vec4(0.0);
  vec2 ex = vec2(A.x, B.x) * blur * 0.707, ey = vec2(A.y, B.y) * blur * 0.707;
  float lod = max(0.0, base + log2(blur * 1.414 * uDpr));
  return (TEXL(t, uv + ex + ey, lod) + TEXL(t, uv + ex - ey, lod)
    + TEXL(t, uv - ex + ey, lod) + TEXL(t, uv - ex - ey, lod)) * 0.25;
}
vec4 over(vec4 top, vec4 under) { return top + under * (1.0 - top.a); }
// the drawings on bare paper, sharp
vec4 drawingsSharp(vec2 p) {
  vec4 c = vec4(0.0);
  if (uNDraw > 0.5) c = drawSharp(uDraw0, uDrawA[0], uDrawB[0], uDrawL[0], p) * uDrawO[0];
  if (uNDraw > 1.5) c = over(drawSharp(uDraw1, uDrawA[1], uDrawB[1], uDrawL[1], p) * uDrawO[1], c);
  if (uNDraw > 2.5) c = over(drawSharp(uDraw2, uDrawA[2], uDrawB[2], uDrawL[2], p) * uDrawO[2], c);
  if (uNDraw > 3.5) c = over(drawSharp(uDraw3, uDrawA[3], uDrawB[3], uDrawL[3], p) * uDrawO[3], c);
  return c;
}
// the drawings as the glass sees them (glassSurface in lib/gl.ts)
vec4 drawings(vec2 p, float blur) {
  vec4 c = vec4(0.0);
  if (uNDraw > 0.5) c = drawFrost(uDraw0, uDrawA[0], uDrawB[0], uDrawL[0], p, blur) * uDrawO[0];
  if (uNDraw > 1.5) c = over(drawFrost(uDraw1, uDrawA[1], uDrawB[1], uDrawL[1], p, blur) * uDrawO[1], c);
  if (uNDraw > 2.5) c = over(drawFrost(uDraw2, uDrawA[2], uDrawB[2], uDrawL[2], p, blur) * uDrawO[2], c);
  if (uNDraw > 3.5) c = over(drawFrost(uDraw3, uDrawA[3], uDrawB[3], uDrawL[3], p, blur) * uDrawO[3], c);
  return c;
}
// The cards alone (what the DOM draws) and the liquid (cards plus the swell).
// gCardGL: whether the nearest card's glass is this canvas's (while it swells
// or buds) rather than the browser's.
float gCardGL = 0.0;
float cards(vec2 p, out float alpha) {
  float d = 1e5;
  alpha = 0.0;
  gCardGL = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uNCards) break;
    vec4 c = uCards[i];
    float di = sdBox(p, c.xy + c.zw * 0.5, c.zw * 0.5, uCardP[i].x);
    if (di < d) { d = di; alpha = uCardP[i].y; gCardGL = uCardP[i].z; }
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
  // p in viewport px (the canvas starts uMargin above the viewport)
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr - vec2(0.0, uMargin);
  // Under every card this canvas paints the frost (glassFrost: the page
  // blurred by the glass's 1.6px and bent through its lens at the rim), the
  // same frost as a swell's or a bud's. On a card the browser's glass layer
  // adds the rest (.glass-back: saturation, the lift and the fill, the same
  // arithmetic as glassTone); where this canvas owns the glass, past a card's
  // box (a swell, a bud) and the whole card while it swells or buds
  // (.glass-gl, when the browser's layer steps aside), it adds them itself.
  // So card, swell and bud are one frost with one tone whichever draws it:
  // where the browser's blur met this canvas's frost (its blur stops hard at
  // its box, and blurs differently from this one: the drawings by up to 52
  // levels) a faint line always showed, wherever they met.
  float ca = 0.0;
  float dc = 1e5;
  if (uNCards > 0.5) dc = cards(p, ca);
  float cgl = gCardGL;
  // the rim's hole (same falloff as .ring-mask): 0 in the hole around a
  // swell, 1 away from it
  float ringVis = uHoleR > 0.5 ? clamp((length(p - uBlob.xy) - uHoleR) / 14.0, 0.0, 1.0) : 1.0;
  float aa = 0.7 / uDpr;
  // Near a card's edge (the lens's bevel, a swell, a bud): dl, the cards and
  // their swell (whose rim this canvas draws); dg, the whole glass outline,
  // buds included (a bud's rim is its own canvas's); n, its outward normal.
  // Deep inside a card the glass is flat.
  bool near = uNCards > 0.5 && (dc > -23.0 || ringVis < 1.0);
  float dl = dc, dg = dc, gw = 1.0;
  vec2 n = vec2(0.0);
  if (near) {
    dl = liquid(p, dc);
    dg = glassD(p, dc, gw);
    if (dg < 2.5 && ca > 0.01) {
      float t1, t2, gw1, gw2;
      float gx = glassD(p + vec2(1.0, 0.0), cards(p + vec2(1.0, 0.0), t1), gw1) - dg;
      float gy = glassD(p + vec2(0.0, 1.0), cards(p + vec2(0.0, 1.0), t2), gw2) - dg;
      n = normalize(vec2(gx, gy) + 1e-5);
    }
  }
  float inGlass = uNCards > 0.5 ? (1.0 - smoothstep(-aa, aa, dg)) * ca * gw : 0.0;
  vec3 col = vec3(0.0);
  if (inGlass < 1.0) {
    // the bare page, sharp
    col = mix(uBg, uDot, dots(p) * uDotA);
    vec4 dr = drawingsSharp(p);
    col = col * (1.0 - dr.a) + dr.rgb;
  }
  if (inGlass > 0.0) {
    // the frost, with the rim's inner light in it (from the whole liquid
    // outline, so it runs on into a swell), painted here for every card
    vec3 frost = mix(glassFrost(p, uScroll, dg, n), vec3(1.0), glassGlow(dg));
    // and where this canvas owns the glass, the tone and the fill over it,
    // as the browser's glass layer does them everywhere else
    float own = max(smoothstep(-aa, aa, dc), cgl);
    col = mix(col, mix(frost, mix(glassTone(frost), uFill, uFillA), own), inGlass);
  }
  if (near && (dc > -3.0 || ringVis < 1.0)) {
    // The cards' drop shadow (--glass-drop), cast by the whole glass outline,
    // swells and buds included. Cast by the card's box (CSS), it lay over a
    // swell's base and stopped dead at the card's straight edge: a line
    // through the swell. Same offset, blur, spread and colour as the CSS one,
    // and like it, only outside the glass.
    if (dg > -1.0 && dg < 70.0 && ca > 0.01) {
      float off = mix(18.0, 24.0, uDark), sigma = mix(18.0, 24.0, uDark), spread = mix(20.0, 24.0, uDark);
      vec2 ps = p - vec2(0.0, off);
      float ts, gws;
      float ds = glassD(ps, cards(ps, ts), gws) + spread;
      float a = mix(0.3, 0.7, uDark) * smoothstep(1.6 * sigma, -1.6 * sigma, ds);
      float outside = smoothstep(-0.7 / uDpr, 0.7 / uDpr, dg);
      col = mix(col, mix(vec3(0.157, 0.141, 0.118), vec3(0.0), uDark), a * ca * outside);
    }
    if (dg < 2.5 && ca > 0.01) {
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

// The canvas is part of the page, not fixed to the window: the browser
// scrolls the page on its own thread, ahead of this loop, and a fixed canvas
// (which paints the cards' glass, fill and shadow) trailed the cards by a
// frame or more, shimmering at their edges. Placed at the scroll position
// each time it draws, with this much to spare above and below, it moves with
// the cards between draws.
const MARGIN = 160;
// the crossfade from the CSS glass to the canvas's (matches .dot-field in globals.css)
const REVEAL_MS = 600;

// ─── Warm-up ───────────────────────────────────────────────────────────────
// The shader is compiled, and drawn once into a single pixel, as soon as this
// module loads: the canvas is in the server's HTML, so this runs before React
// has hydrated the page, while the cards are still invisible. Two costs move
// out of sight that way: the compile, which used to wait for hydration (over a
// second in development), and the driver finishing the shader on its first
// draw (over a second on a cold load, since it builds all of it at once).
// Started from the effect, both landed after the page had appeared, and the
// frost arrived seconds late.
type Warm = {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  texLod: boolean;
  poll: () => WebGLProgram | null | "pending";
};
let warm: Warm | null = null;
function warmUp(canvas: HTMLCanvasElement): Warm | null {
  if (warm?.canvas === canvas && !warm.gl.isContextLost()) return warm;
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "low-power" });
  if (!gl || gl.isContextLost()) return null;
  // explicit mip levels for the drawings; without them the drawings stay DOM
  const texLod = !!gl.getExtension("EXT_shader_texture_lod");
  // The shader compiles in the background (KHR_parallel_shader_compile):
  // compiled synchronously, it froze the first load. Until it's ready the CSS
  // dot grid is what shows.
  const poll = compileFullscreen(gl, FRAG(texLod));
  const w: Warm = { canvas, gl, texLod, poll };
  warm = w;
  const tick = () => {
    if (warm !== w) return;
    const prog = poll();
    if (prog === "pending") {
      requestAnimationFrame(tick);
      return;
    }
    if (!prog) return;
    // its first use, into one pixel of a canvas nobody can see yet (opacity 0)
    gl.viewport(0, 0, 1, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  requestAnimationFrame(tick);
  return w;
}
if (typeof document !== "undefined") {
  const c = document.querySelector<HTMLCanvasElement>("canvas.dot-field");
  if (c) warmUp(c);
}

export default function DotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  // Photography has its own darkroom backdrop; the drafting sheet stays out of it.
  const enabled = !pathname?.startsWith("/photography");
  const waveRef = useRef<(x?: number, y?: number) => void>(() => {});
  const lastDown = useRef<{ x: number; y: number; t: number } | null>(null);

  // The cards' CSS frost (globals.css, .glass-panel[data-liquid]::before) is a
  // pattern of blurred dots that has to land on the page's own grid, so each
  // liquid card is told its offset from it: from its layout position (the
  // offsets, which ignore the rise's transform, plus <body>'s own place on the
  // page, which they leave out), whenever cards mount or the layout changes.
  useLayoutEffect(() => {
    if (!enabled) return;
    const gap = paper.gap;
    let queued = 0;
    const align = () => {
      queued = 0;
      const body = document.body.getBoundingClientRect();
      const bx = body.left + window.scrollX, by = body.top + window.scrollY;
      for (const el of Array.from(document.querySelectorAll<HTMLElement>(".glass-panel[data-liquid]"))) {
        let x = bx, y = by;
        for (let e: HTMLElement | null = el; e && e !== document.body; e = e.offsetParent as HTMLElement | null) {
          x += e.offsetLeft + e.clientLeft;
          y += e.offsetTop + e.clientTop;
        }
        el.style.setProperty("--frost-x", `${-(((x % gap) + gap) % gap)}px`);
        el.style.setProperty("--frost-y", `${-(((y % gap) + gap) % gap)}px`);
      }
    };
    const later = () => { if (!queued) queued = requestAnimationFrame(align); };
    align();
    const mo = new MutationObserver(later);
    mo.observe(document.body, { childList: true, subtree: true });
    const ro = new ResizeObserver(later);
    ro.observe(document.body);
    return () => { mo.disconnect(); ro.disconnect(); cancelAnimationFrame(queued); };
  }, [enabled, pathname]);

  // Which cards can wear the browser's frost (.glass-live, globals.css): those
  // with every element above them fully opaque. Inside a fading ancestor (a
  // card rising in, a page arriving or leaving) the browser's blur switches
  // off, so the card shows its CSS stand-in until the fade is over. Checked
  // each frame while anything could be changing (a scroll, a navigation, new
  // content), and asleep otherwise.
  useEffect(() => {
    if (!enabled) return;
    const panels = document.getElementsByClassName("glass-panel") as HTMLCollectionOf<HTMLElement>;
    const styles = new WeakMap<Element, CSSStyleDeclaration[]>();
    const opaqueAbove = (el: HTMLElement) => {
      let chain = styles.get(el);
      if (!chain) {
        chain = [];
        for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) chain.push(getComputedStyle(e));
        styles.set(el, chain);
      }
      for (const cs of chain) if (parseFloat(cs.opacity) < 0.999) return false;
      return true;
    };
    let raf = 0, quiet = 0;
    const tick = () => {
      raf = 0;
      const h = window.innerHeight;
      let changed = false, waiting = false;
      for (const el of Array.from(panels)) {
        if (!el.hasAttribute("data-liquid") || !el.isConnected) continue;
        const r = el.getBoundingClientRect();
        if (r.bottom < -h || r.top > 2 * h) continue;
        const live = opaqueAbove(el);
        if (live !== el.classList.contains("glass-live")) {
          el.classList.toggle("glass-live", live);
          changed = true;
        }
        if (!live && r.bottom > 0 && r.top < h) waiting = true;
      }
      // Keep watching for half a second after the last change (a fade can
      // start a beat after the scroll or click that caused it), and while a
      // card on screen is still fading in, up to five seconds.
      quiet = changed ? 0 : quiet + 1;
      if (quiet < (waiting ? 300 : 30)) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      quiet = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    wake();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    window.addEventListener("pointerdown", wake);
    const mo = new MutationObserver(wake);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      window.removeEventListener("pointerdown", wake);
      mo.disconnect();
    };
  }, [enabled, pathname]);

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
    // usually already compiling (and warmed up) since this module loaded
    const w = warmUp(canvas);
    if (!w) return;
    const { gl, texLod, poll } = w;
    let stop: (() => void) | null = null;
    let waitRaf = 0;
    let gone = false;
    const begin = (prog: WebGLProgram) => {
      // prettier-ignore
      const u = uniforms(gl, prog, [
        "uRes", "uDpr", "uScroll", "uMargin", "uGap", "uDotR", "uBg", "uDot", "uDotA", "uMouse", "uMouseOn",
        "uRipple", "uOrigin", "uIntro", "uCards", "uCardP", "uNCards", "uBlob", "uHoleR", "uFill", "uFillA", "uDark",
        "uDraw0", "uDraw1", "uDraw2", "uDraw3", "uDrawA", "uDrawB", "uDrawL", "uDrawO", "uNDraw",
        "uBudC", "uBudD", "uBudP", "uBudS", "uNBud",
      ]);
      const cardBuf = new Float32Array(32), cardPBuf = new Float32Array(24);
      const cardEls: HTMLElement[] = [];
      // live: a card that mounts (a page arriving) is in the next frame's list,
      // not up to a second later, part way through its fade
      const panels = document.getElementsByClassName("glass-panel") as HTMLCollectionOf<HTMLElement>;
      const radiusOf = new WeakMap<HTMLElement, number>();
      let lastSig = "";
      // The swell: a blob that rises out of the nearest card's edge toward the cursor.
      const blob = { x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0 };
      let holeEl: HTMLElement | null = null;

      // Opacity through the whole tree, as the browser is compositing it right
      // now, so the frost (and a drawing) fades with its card rather than
      // switching on. It has to be the computed value: Framer Motion runs
      // opacity as a Web Animation on the compositor, and the inline style only
      // jumps from the start value to the end one when it finishes (the frost
      // popped in whole as the card's fade ended). The computed styles are live
      // objects, so the chain is looked up once per element.
      const chains = new WeakMap<Element, CSSStyleDeclaration[]>();
      const opacityOf = (el: Element) => {
        let chain = chains.get(el);
        if (!chain || !el.isConnected) {
          chain = [];
          for (let e: Element | null = el; e && e !== document.body; e = e.parentElement) chain.push(getComputedStyle(e));
          chains.set(el, chain);
        }
        let a = 1;
        for (const cs of chain) {
          a *= parseFloat(cs.opacity);
          if (a <= 0) return 0;
        }
        return a;
      };

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let w = 0, h = 0;
      let dpr = Math.min(window.devicePixelRatio || 1, 2);
      const maxDpr = dpr;
      // The loop runs in Framer Motion's own frame, after it has rendered
      // (postRender), not on a separate requestAnimationFrame: callbacks of the
      // same frame run in the order they were queued, and DotField's often ran
      // first, reading every card where Framer was about to move it from. The
      // frost, fill and shadow it paints trailed a rising card by a frame.
      // \`raf\` is just "a frame is queued".
      let raf = 0, last = performance.now();
      // when the first frame was drawn (the crossfade in starts then); 0 before
      let revealAt = 0, drawn = 0, toneOnly = false;
      const onFrame = (d: FrameData) => frame(d.timestamp);
      const queue = () => { motionFrame.postRender(onFrame); return 1; };
      const unqueue = () => cancelFrame(onFrame);
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
      // Reallocating the backing store clears it, so it's only ever done right
      // before a draw, in the same frame: a cleared canvas never reaches the screen.
      const sizeCanvas = () => {
        const cw = Math.max(1, Math.round(w * dpr)), ch = Math.max(1, Math.round(h * dpr));
        if (canvas.width !== cw) canvas.width = cw;
        if (canvas.height !== ch) canvas.height = ch;
      };
      const resize = () => {
        dpr = Math.min(dpr, Math.min(window.devicePixelRatio || 1, 2));
        const nw = canvas.clientWidth || window.innerWidth;
        const nh = Math.max(canvas.clientHeight || 0, window.innerHeight + MARGIN * 2);
        if (nw === w && nh <= h) return;
        h = nw !== w ? nh : Math.max(h, nh);
        w = nw;
        // the backing store itself is resized in the next frame, just before it
        // draws (sizeCanvas): resized here, the cleared canvas would be on screen
        // for a frame, and with it every card's glass, fill and shadow
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
        unqueue();
        raf = 0;
        canvas.style.transition = "none"; // gone at once, not faded
        canvas.style.opacity = "0";
        showAll();
        releaseBuds();
        // close the swell, so its card doesn't stay marked as this canvas's glass
        if (holeEl) setRingHole(holeEl, "s", 0, 0, 0);
        holeEl = null;
        document.documentElement.classList.remove("paper-gl", "paper-glass");
      };
      canvas.addEventListener("webglcontextlost", onLost);
      document.documentElement.addEventListener("pointerleave", onLeave);
      const onVis = () => { if (!document.hidden) wake(); };
      document.addEventListener("visibilitychange", onVis);
      // A theme switch repaints the paper even if nothing else is moving.
      const themeObs = new MutationObserver(() => wake());
      // The drawings (lib/drawings): one texture each, re-uploaded when the theme
      // or its image changes. A drawing's SVG is hidden only while it's painted here.
      const drawTex = new Map<Drawing, { tex: WebGLTexture; theme: string; size: number; bytes: number; used: number }>();
      // Textures are kept within a memory budget (about every drawing on the
      // page at its size), so scrolling back doesn't re-rasterise one and flip
      // it to its unfrosted SVG under the glass while it does.
      const TEX_BUDGET = 96 * 1024 * 1024;
      // rasters are made one at a time, in idle moments (a drawing is ~1,200
      // paths), and held only until they're uploaded
      const pending = new Set<Drawing>();
      const ready = new Map<Drawing, { theme: string; canvas: HTMLCanvasElement }>();
      let rasterChain: Promise<void> = Promise.resolve();
      let disposed = false;
      const idle = () => new Promise<void>((res) => (window.requestIdleCallback ? window.requestIdleCallback(() => res(), { timeout: 300 }) : window.setTimeout(res, 50)));
      const requestRaster = (d: Drawing, theme: string) => {
        pending.add(d);
        rasterChain = rasterChain.then(idle).then(async () => {
          const c = disposed ? null : await d.raster(theme === "dark");
          pending.delete(d);
          if (c && !disposed) { ready.set(d, { theme, canvas: c }); wake(); }
        });
      };
      const drawBufA = new Float32Array(12), drawBufB = new Float32Array(12), drawBufL = new Float32Array(4), drawBufO = new Float32Array(4);
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
        if (!raf && !document.hidden) { last = performance.now(); raf = queue(); }
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
        // the buds step first, so the glass drawn below is of their shape this frame
        stepBuds(now);
        let busy = scrolling || themeChanged || settling || ripple.t >= 0 || introT < 2.2 || now - lastActive < 250 || buds.size > 0 || budTicks.size > 0;

        // Never negative: wake() stamps \`last\` from inside an input handler, and
        // the frame's own timestamp (when the frame began) can be earlier than
        // that, by a whole frame after a long one. The springs are exact for any
        // step forward, but a step back grows them by exp(omega * |dt|): after a
        // hang, one frame threw the swell hundreds of px wide and the cursor's
        // swelling dots into a solid block.
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
        last = now;

        // Adaptive resolution: if busy frames keep running long, step the pixel ratio down.
        if (busy && dt > 0.024) slowMs += dt * 1000; else slowMs = Math.max(0, slowMs - dt * 500);
        if (slowMs > 600 && dpr > 1) {
          dpr = Math.max(1, dpr - 0.25);
          slowMs = 0;
        }

        const pal = dark ? paper.dark : paper.light;
        const glass = dark ? paper.glass.dark : paper.glass.light;

        // Visible cards, nearest first.
        let n = 0;
        let sig = "";
        let near: { d: number; ex: number; ey: number; nx: number; ny: number; el: HTMLElement; left: number; top: number } | null = null;
        for (const el of Array.from(panels)) {
          if (n >= 8) break;
          if (!el.hasAttribute("data-liquid")) continue;
          const r = el.getBoundingClientRect();
          if (r.bottom < -40 || r.top > h + 40 || r.width < 1) continue;
          let rad = radiusOf.get(el);
          if (rad === undefined) {
            rad = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
            radiusOf.set(el, rad);
          }
          const a = opacityOf(el);
          cardBuf[n * 4] = r.left; cardBuf[n * 4 + 1] = r.top; cardBuf[n * 4 + 2] = r.width; cardBuf[n * 4 + 3] = r.height;
          cardPBuf[n * 3] = Math.min(rad, r.width / 2, r.height / 2); cardPBuf[n * 3 + 1] = a;
          cardEls[n] = el;
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
        // It lives in its card's own coordinates (blob.x, blob.y are card-local),
        // so it scrolls with the card; in window coordinates its spring trailed a
        // fast-scrolling card and the blob came loose as a separate bubble. It
        // belongs to one card at a time, and moves to another only once it has
        // shrunk away.
        const REACH = 120;
        if (near && near.el !== holeEl && (!holeEl || blob.r < 0.5)) {
          if (holeEl) setRingHole(holeEl, "s", 0, 0, 0);
          holeEl = near.el;
          blob.r = 0; blob.vr = 0;
        }
        const own = holeEl ? holeEl.getBoundingClientRect() : null;
        let tx = blob.x, ty = blob.y, tr = 0;
        if (own && near && near.el === holeEl && near.d < REACH && !reduced) {
          const k = 1 - near.d / REACH;
          tr = 10 + 26 * k;
          // never so far out that the smooth union lets go: it reaches, it doesn't drip
          const out = Math.min(near.d * 0.6, tr * 0.6 + 8);
          tx = near.ex - own.left + near.nx * out;
          ty = near.ey - own.top + near.ny * out;
          if (blob.r < 0.5) { blob.x = near.ex - own.left - near.nx * 20; blob.y = near.ey - own.top - near.ny * 20; blob.vx = blob.vy = 0; }
        }
        let sb = springTo(blob.x, blob.vx, tx, 14, dt);
        blob.x = sb[0]; blob.vx = sb[1];
        sb = springTo(blob.y, blob.vy, ty, 14, dt);
        blob.y = sb[0]; blob.vy = sb[1];
        sb = springTo(blob.r, blob.vr, tr, 14, dt);
        blob.r = Math.max(0, sb[0]); blob.vr = sb[1];
        const blobBusy = Math.abs(blob.vr) > 0.5 || Math.abs(blob.r - tr) > 0.3 || Math.hypot(blob.vx, blob.vy) > 2;
        if (moved || blobBusy) { lastActive = now; busy = true; }
        // where it is on screen, for the shader
        const blobX = own ? own.left + blob.x : -9999, blobY = own ? own.top + blob.y : -9999;

        // Open the card's rim around the swell (the shader draws the rim there instead).
        const holeR = blob.r > 0.5 ? blob.r + 34 : 0;
        if (holeEl) {
          setRingHole(holeEl, "s", blob.x, blob.y, holeR);
          if (holeR === 0 && (!near || near.el !== holeEl)) holeEl = null;
        }
        const sp = springTo(mouse.on, mouse.onV, mouse.x > -9000 ? 1 : 0, 9, dt);
        mouse.on = sp[0];
        mouse.onV = sp[1];
        if (ripple.t >= 0) { ripple.t += dt; if (ripple.t > 1.6) ripple.t = -1; }

        // The drawings on screen (at most four): where each sits, as the affine
        // map from viewport px to its image's uv (the inverse of its screen CTM).
        // A drawing within about a screen of view gets its raster (this theme's)
        // ahead of time; the image is uploaded and let go.
        let nd = 0;
        let dsig = "";
        const theme = dark ? "dark" : "light";
        for (const d of allDrawings()) {
          let on = false;
          const m = texLod && d.svg.isConnected ? d.svg.getScreenCTM() : null;
          if (m) {
            const b = d.box;
            const xs = [b.x, b.x + b.w], ys = [b.y, b.y + b.h];
            let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
            for (const x of xs) for (const y of ys) {
              const px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f;
              x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
            }
            const near = x1 > -w * 0.5 && x0 < w * 1.5 && y1 > -h && y0 < h * 2;
            const inView = x1 > -40 && x0 < w + 40 && y1 > -40 && y0 < h + 40;
            let t = drawTex.get(d);
            if (near && (!t || t.theme !== theme)) {
              const r = ready.get(d);
              if (r && r.theme === theme) {
                const tex = t?.tex ?? gl.createTexture();
                if (tex) {
                  gl.activeTexture(gl.TEXTURE0);
                  gl.bindTexture(gl.TEXTURE_2D, tex);
                  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, r.canvas);
                  gl.generateMipmap(gl.TEXTURE_2D);
                  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                  t = { tex, theme, size: r.canvas.width, bytes: r.canvas.width * r.canvas.height * 4 * 1.34, used: now };
                  drawTex.set(d, t);
                }
                ready.delete(d);
                r.canvas.width = r.canvas.height = 0; // uploaded: let the image go
              } else if (!pending.has(d)) {
                requestRaster(d, theme);
              }
            }
            // (a texture of the other theme is still drawn until this theme's is
            // ready: better a moment in the old ink than the SVG flipping in)
            if (inView && nd < 4 && t) {
              gl.activeTexture(gl.TEXTURE0 + nd);
              gl.bindTexture(gl.TEXTURE_2D, t.tex);
              t.used = now;
              const inv = new DOMMatrix([m.a, m.b, m.c, m.d, m.e, m.f]).inverse();
              drawBufA.set([inv.a / b.w, inv.c / b.w, (inv.e - b.x) / b.w], nd * 3);
              drawBufB.set([inv.b / b.h, inv.d / b.h, (inv.f - b.y) / b.h], nd * 3);
              // its own mip level: texels per device px at its current size
              drawBufL[nd] = Math.log2(t.size / (b.w * Math.hypot(m.a, m.b) * (canvas.width / w)));
              const o = opacityOf(d.svg);
              drawBufO[nd] = o;
              dsig += `${m.a.toFixed(3)},${m.e | 0},${m.f | 0},${o.toFixed(2)};`;
              nd++;
              on = true;
            }
          }
          // the SVG stays until the canvas has faded in, or the drawing would dip
          setHidden(d, on && revealAt > 0 && now - revealAt > REVEAL_MS);
        }
        // within the budget: the least recently drawn go first
        let bytes = 0;
        for (const t of drawTex.values()) bytes += t.bytes;
        if (bytes > TEX_BUDGET) {
          const old = Array.from(drawTex).filter(([, t]) => t.used !== now).sort((x, y) => x[1].used - y[1].used);
          for (const [d, t] of old) {
            if (bytes <= TEX_BUDGET) break;
            gl.deleteTexture(t.tex);
            drawTex.delete(d);
            bytes -= t.bytes;
          }
        }
        for (const [d, t] of drawTex) if (!allDrawings().has(d)) { gl.deleteTexture(t.tex); drawTex.delete(d); hidden.delete(d); }
        for (const d of ready.keys()) if (!allDrawings().has(d)) ready.delete(d);
        // a drawing that moves without a scroll (a card rising into place) keeps the loop awake
        if (dsig !== lastDrawSig) { lastDrawSig = dsig; lastActive = now; busy = true; }

        sizeCanvas();
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(u.uRes, w, h);
        gl.uniform1f(u.uMargin, MARGIN);
        // placed for this frame's scroll, in the same frame as it's drawn, from
        // where its wrapper actually is: the wrapper fills <body>, and a child's
        // top margin collapsing through <body> put it 8px down the page, so
        // placing the canvas by scrollY alone drew every card's glass 8px low
        const wr = (canvas.parentElement ?? canvas).getBoundingClientRect();
        canvas.style.transform = `translate3d(${-wr.left}px, ${-MARGIN - wr.top}px, 0)`;
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
        // whose glass each card wears, read after this frame's swell and buds
        // have set it (setRingHole), so the browser's glass steps aside in the
        // same frame this canvas takes it over
        for (let i = 0; i < n; i++) cardPBuf[i * 3 + 2] = cardEls[i].classList.contains("glass-gl") ? 1 : 0;
        gl.uniform3fv(u.uCardP, cardPBuf);
        gl.uniform1f(u.uNCards, n);
        gl.uniform3f(u.uBlob, blobX, blobY, Math.max(0, blob.r));
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
        gl.uniform1fv(u.uDrawO, drawBufO);
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
        if (!revealAt && ++drawn >= 3) {
          // The takeover is a crossfade, not a switch: the canvas (the same
          // dots, the drawings, the shadows) fades in over the CSS paper as
          // the cards' CSS shadows fade out (paper-gl), over REVEAL_MS. It
          // starts on the third frame drawn, not the first: the driver
          // finishes the shader on its first use, a long frame, and a fade
          // started then ran its course behind the stall and arrived as a jump.
          revealAt = now;
          canvas.style.opacity = "1";
          document.documentElement.classList.add("paper-gl");
        }
        // Then, with the canvas all the way in (its frost under every card),
        // the browser's glass lets go of its blur (paper-glass, over the same
        // REVEAL_MS) and keeps only the tone and the fill.
        if (revealAt && !toneOnly && now - revealAt > REVEAL_MS) {
          toneOnly = true;
          document.documentElement.classList.add("paper-glass");
        }

        // With nothing moving, the last frame stays on screen and the loop sleeps
        // until the next scroll, pointer move, click, resize or theme change.
        // The frame it rests on is always at full resolution: the drawings are
        // painted here, and a step down for a slow burst (a bud, a fast scroll)
        // would otherwise leave them soft for the rest of the visit.
        if (!busy && dpr < maxDpr) {
          dpr = maxDpr;
          slowMs = 0;
          busy = true; // one more frame, at full resolution (resized as it draws)
        }
        // (a bud stepping above may already have woken the loop: never queue two frames)
        if (!toneOnly) busy = true; // warming up, then handing over: keep drawing until it's done
        if (busy && !raf) raf = queue();
      }
      glassDriver.active = true;
      raf = queue();

      return () => {
        unqueue();
        disposed = true;
        releaseBuds();
        if (holeEl) setRingHole(holeEl, "s", 0, 0, 0);
        document.documentElement.classList.remove("paper-gl", "paper-glass");
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
    };
    const wait = () => {
      if (gone) return;
      const r = poll();
      if (r === "pending") { waitRaf = requestAnimationFrame(wait); return; }
      if (r) stop = begin(r); // else a broken shader: the CSS dots stay
    };
    wait();
    return () => {
      gone = true;
      cancelAnimationFrame(waitRaf);
      // Not started yet: the warm context stays for the next mount (React
      // mounts effects twice in development). Started: it's torn down.
      if (stop) {
        stop();
        if (warm?.canvas === canvas) warm = null;
      }
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div className="dot-field-wrap" aria-hidden>
      <canvas ref={canvasRef} className="dot-field" style={{ opacity: 0 }} />
    </div>
  );
}
