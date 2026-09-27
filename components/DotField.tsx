"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { paper } from "@/lib/tokens";
import { setRingHole } from "@/lib/liquid";
import { GLSL_GLASS, fullscreenProgram, rgb, uniforms } from "@/lib/gl";

// ─── DotField ───────────────────────────────────────────────────────────────
// The page's dot grid, redrawn in WebGL as one fixed backdrop behind every CS
// page, so it can move:
//   - dots swell and part around the cursor
//   - on every navigation the grid configures itself in a wave, starting from
//     wherever you clicked to get there
//   - a click on bare paper sends a ripple through the dots
//   - under every card ([data-liquid]) the dots are frosted: blurred, and bent
//     by the card's rim like the edge of a lens
//   - a card is liquid: as the cursor comes near, its edge swells and reaches
//     toward it on a wobbly spring, and settles back when the cursor leaves
//
// Dots are drawn in page space at exactly the positions of the CSS dots
// (lib/tokens `paper`), so there's no seam when the canvas appears, and if
// WebGL is missing the CSS grid is simply what you see.
//
// Cost: every pixel evaluates one grid cell. Per-dot movement is capped so a
// dot can never leave its own cell, which is what makes a single evaluation
// exact. Resolution steps down on its own if frames run long, and the loop
// stops entirely once nothing is moving.

const FRAG = `
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
${GLSL_GLASS}
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
  vec3 col = mix(uBg, uDot, dots(p) * uDotA);

  if (uNCards > 0.5) {
    float ca;
    float dc = cards(p, ca);
    float dl = liquid(p, dc);
    if (dl < 2.5 && ca > 0.01) {
      float aa = 0.7 / uDpr;
      // rim normal of the liquid, and how close to the rim we are
      float t1, t2;
      float gx = liquid(p + vec2(1.0, 0.0), cards(p + vec2(1.0, 0.0), t1)) - dl;
      float gy = liquid(p + vec2(0.0, 1.0), cards(p + vec2(0.0, 1.0), t2)) - dl;
      vec2 n = normalize(vec2(gx, gy) + 1e-5);
      float rim = 1.0 - clamp(-dl / 26.0, 0.0, 1.0);
      rim *= rim;
      // the dots under the glass, bent outward at the rim and frosted
      vec2 q = p + n * rim * 11.0;
      vec3 frost = mix(uBg, uDot, frostDots(q, uScroll, uGap, uDotR) * uDotA);
      float inLiquid = 1.0 - smoothstep(-aa, aa, dl);
      float outCard = smoothstep(-aa, aa, dc);
      // where the liquid reaches past the DOM card, paint the card's fill too
      vec3 swell = mix(frost, uFill, uFillA);
      vec3 inside = mix(frost, swell, outCard);
      col = mix(col, inside, inLiquid * ca);
      // The rim of the whole liquid outline, just outside it: along the swell,
      // and along the card's edge inside the hole opened in the card's own rim
      // (same falloff as .ring-mask), so the border molds into the swell.
      float ringVis = uHoleR > 0.5 ? clamp((length(p - uBlob.xy) - uHoleR) / 14.0, 0.0, 1.0) : 1.0;
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

    const prog = fullscreenProgram(gl, FRAG);
    if (!prog) return; // the CSS dots stay
    // prettier-ignore
    const u = uniforms(gl, prog, [
      "uRes", "uDpr", "uScroll", "uGap", "uDotR", "uBg", "uDot", "uDotA", "uMouse", "uMouseOn",
      "uRipple", "uOrigin", "uIntro", "uCards", "uCardP", "uNCards", "uBlob", "uHoleR", "uFill", "uFillA", "uDark",
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
    };
    canvas.addEventListener("webglcontextlost", onLost);
    document.documentElement.addEventListener("pointerleave", onLeave);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    // A theme switch repaints the paper even if nothing else is moving.
    const themeObs = new MutationObserver(() => wake());
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
      let busy = scrolling || themeChanged || settling || ripple.t >= 0 || introT < 2.2 || now - lastActive < 250;

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

      // The swell reaches about halfway to the cursor and grows as it closes in;
      // underdamped, so it wobbles as it rises and when it lets go.
      const REACH = 120;
      let tx = blob.x, ty = blob.y, tr = 0;
      if (near && near.d < REACH && !reduced) {
        const k = 1 - near.d / REACH;
        tr = 10 + 26 * k;
        // never so far out that the smooth union lets go: it reaches, it doesn't drip
        const out = Math.min(near.d * 0.6, tr * 0.6 + 8);
        tx = near.ex + near.nx * out;
        ty = near.ey + near.ny * out;
        if (blob.r < 0.5) { blob.x = near.ex - near.nx * 20; blob.y = near.ey - near.ny * 20; }
      }
      const W = 16, Z = 0.42;
      for (let i = 0, hs = dt / 4; i < 4; i++) {
        blob.vx += (-2 * Z * W * blob.vx - W * W * (blob.x - tx)) * hs; blob.x += blob.vx * hs;
        blob.vy += (-2 * Z * W * blob.vy - W * W * (blob.y - ty)) * hs; blob.y += blob.vy * hs;
        blob.vr += (-2 * 0.35 * 18 * blob.vr - 18 * 18 * (blob.r - tr)) * hs; blob.r += blob.vr * hs;
      }
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
