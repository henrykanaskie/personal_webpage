"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { paper } from "@/lib/tokens";
import { GLASS_GLSL, setRingHole } from "@/lib/liquid";

// ─── DotField ───────────────────────────────────────────────────────────────
// The page's dot grid, redrawn in WebGL as one fixed backdrop behind every CS
// page, so it can move:
//   - dots swell and part around the cursor
//   - on every navigation the grid configures itself in a wave, starting from
//     wherever you clicked to get there
//   - a click on bare paper sends a ripple through the dots
//   - under every card ([data-liquid]) the dots are seen through the info
//     bubbles' glass: blurred, lensed at the rim, lifted (GLASS_GLSL)
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

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

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

float sdBox(vec2 p, vec2 c, vec2 hs, float r) {
  vec2 q = abs(p - c) - hs + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
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

// The glass under every card and swell: the bubble's (lib/liquid GLASS_GLSL).
${GLASS_GLSL}

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
      // the dots under the glass: blurred, lensed at the rim of the liquid
      // outline (so the refraction follows a swell), and lifted, as through
      // a bubble; the rim's inner light over them
      vec3 frost = glassSurface(p, uScroll, dl, n);
      float inLiquid = 1.0 - smoothstep(-aa, aa, dl);
      // The swell's fill tucks 0.75px under the card: the DOM fill snaps to
      // device pixels on its own, and without the overlap a sliver of bare
      // paper shows between them as a line across the swell's base. Outside
      // the swell the card's lip hairline covers the overlap.
      float outCard = smoothstep(-aa, aa, dc + 0.75);
      // where the liquid reaches past the DOM card, paint the card's fill too
      vec3 swell = mix(frost, uFill, uFillA);
      vec3 inside = mix(mix(frost, swell, outCard), vec3(1.0), glassGlow(dl));
      col = mix(col, inside, inLiquid * ca);
      // The rim of the whole liquid outline, just outside it: along the swell,
      // and along the card's edge inside the hole opened in the card's own rim
      // (same falloff as .ring-mask), so the border molds into the swell.
      float ringVis = uHoleR > 0.5 ? clamp((length(p - uBlob.xy) - uHoleR) / 14.0, 0.0, 1.0) : 1.0;
      float lineW = max(smoothstep(0.5, 1.5, dc) * (1.0 - smoothstep(-0.5, 0.5, dl - 1.5)), 1.0 - ringVis);
      // the glass edge (--edge-lip, --edge-film in globals.css): a white
      // hairline, brighter on top, with the thin film just inside it
      float line = (1.0 - smoothstep(0.0, 1.0, abs(dl - 0.4))) * lineW;
      float lipA = mix(0.45 + 0.47 * max(-n.y, 0.0) + 0.22 * max(n.y, 0.0), 0.09 + 0.19 * max(-n.y, 0.0), uDark);
      float wl = max(-n.x, 0.0), wr = max(n.x, 0.0), wt = max(-n.y, 0.0), wb = max(n.y, 0.0);
      vec3 film = (vec3(1.0, 0.59, 0.8) * wl + vec3(0.47, 0.8, 1.0) * wr + vec3(0.73, 0.63, 1.0) * wt + vec3(1.0, 0.86, 0.55) * wb) / (wl + wr + wt + wb + 1e-3);
      float band = smoothstep(-6.0, -0.5, dl) * (1.0 - smoothstep(-0.5, 0.5, dl)) * lineW;
      col = mix(col, film, band * ca * mix(0.3, 0.27, uDark));
      col = mix(col, vec3(1.0), line * ca * lipA);
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
const CONTENT = ".glass-panel, .glass-pill, .metal-surface, a, button, img, input, textarea, p, h1, h2, h3, h4, li";

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

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    } catch {
      return; // the CSS dots stay
    }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      res: U("uRes"), dpr: U("uDpr"), scroll: U("uScroll"), gap: U("uGap"), dotR: U("uDotR"),
      bg: U("uBg"), dot: U("uDot"), dotA: U("uDotA"), mouse: U("uMouse"), mouseOn: U("uMouseOn"),
      ripple: U("uRipple"), origin: U("uOrigin"), intro: U("uIntro"),
      cards: U("uCards"), cardP: U("uCardP"), nCards: U("uNCards"), blob: U("uBlob"), holeR: U("uHoleR"),
      fill: U("uFill"), fillA: U("uFillA"), dark: U("uDark"),
    };
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

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, w, h);
      gl.uniform1f(u.dpr, canvas.width / w);
      gl.uniform2f(u.scroll, window.scrollX, scrollY);
      gl.uniform1f(u.gap, paper.gap);
      gl.uniform1f(u.dotR, paper.dotRadius);
      gl.uniform3f(u.bg, pal.bg[0] / 255, pal.bg[1] / 255, pal.bg[2] / 255);
      gl.uniform3f(u.dot, pal.dot[0] / 255, pal.dot[1] / 255, pal.dot[2] / 255);
      gl.uniform1f(u.dotA, pal.dotAlpha);
      gl.uniform2f(u.mouse, mouse.x, mouse.y);
      gl.uniform1f(u.mouseOn, Math.max(0, mouse.on));
      gl.uniform3f(u.ripple, ripple.x, ripple.y, ripple.t);
      gl.uniform2f(u.origin, wave.x, wave.y);
      gl.uniform1f(u.intro, introT);
      gl.uniform4fv(u.cards, cardBuf);
      gl.uniform2fv(u.cardP, cardPBuf);
      gl.uniform1f(u.nCards, n);
      gl.uniform3f(u.blob, blob.x, blob.y, Math.max(0, blob.r));
      gl.uniform1f(u.holeR, holeR);
      gl.uniform3f(u.fill, glass.fill[0] / 255, glass.fill[1] / 255, glass.fill[2] / 255);
      gl.uniform1f(u.fillA, glass.alpha);
      gl.uniform1f(u.dark, dark ? 1 : 0);
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
