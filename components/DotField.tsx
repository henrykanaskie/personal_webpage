"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { paper } from "@/lib/tokens";

// ─── DotField ───────────────────────────────────────────────────────────────
// The page's dot grid, redrawn in WebGL as one fixed backdrop behind every CS
// page, so it can move:
//   - dots swell and part around the cursor
//   - on every navigation the grid configures itself in a wave, starting from
//     wherever you clicked to get there
//   - a click on bare paper sends a ripple through the dots
//   - glass bubbles drift over the sheet at different depths (they rise at
//     different rates as you scroll) and refract the grid under them; one
//     follows the cursor as a lens, but only while it's over bare paper
//
// Dots are drawn in page space at exactly the positions of the CSS dots
// (lib/tokens `paper`), so there's no seam when the canvas appears, and if
// WebGL is missing the CSS grid is simply what you see.
//
// Cost: every pixel evaluates one grid cell. Per-dot movement is capped so a
// dot can never leave its own cell, which is what makes a single evaluation
// exact. Resolution steps down on its own if frames run long.

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const NB = 5; // bubbles; the last one is the cursor lens

const FRAG = `
precision highp float;
uniform vec2 uRes;        // css px
uniform float uDpr;
uniform vec2 uScroll;     // page position of the viewport's top-left
uniform float uGap, uDotR;
uniform vec3 uBg, uDot;
uniform float uDotA, uDark, uTime;
uniform vec2 uMouse;      // css px, viewport
uniform float uMouseOn;
uniform vec3 uRipple;     // x, y (viewport), seconds since click
uniform vec2 uOrigin;     // intro wave origin (viewport)
uniform float uIntro;     // seconds since the last navigation
uniform vec3 uBub[${NB}];

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

vec3 sheet(vec2 p) { return mix(uBg, uDot, dots(p) * uDotA); }

float bfield(vec2 p) {
  float f = 0.0;
  for (int i = 0; i < ${NB}; i++) {
    vec3 b = uBub[i];
    if (b.z < 0.5) continue;
    vec2 d = p - b.xy;
    float k = b.z * b.z / (dot(d, d) + 1.0);
    f += k * k;
  }
  return f;
}
float bh(float f) { return sqrt(max(0.0, 1.0 - inversesqrt(max(f, 1e-4)))); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  vec3 col = sheet(p);

  // each bubble casts a soft shadow, with the caustic a lens focuses into it
  for (int i = 0; i < ${NB}; i++) {
    vec3 b = uBub[i];
    if (b.z < 0.5) continue;
    vec2 sp = p - (b.xy + vec2(b.z * 0.2, b.z * 0.6));
    float s2 = dot(sp, sp) / (b.z * b.z);
    if (s2 > 9.0) continue;
    col *= 1.0 - (0.09 - 0.035 * uDark) * exp(-s2 * 2.0);
    vec2 cp = p - (b.xy + vec2(b.z * 0.18, b.z * 0.5));
    col += (0.07 - 0.045 * uDark) * exp(-dot(cp, cp) / (b.z * b.z * 0.045));
  }

  float f = bfield(p);
  if (f > 0.3) {
    float fx = bfield(p + vec2(1.0, 0.0)), fy = bfield(p + vec2(0.0, 1.0));
    float h = bh(f);
    vec3 n = normalize(vec3(-(bh(fx) - h) * 55.0, -(bh(fy) - h) * 55.0, 1.0));
    float aa = clamp(length(vec2(fx - f, fy - f)) * 0.9 * uDpr, 1e-4, 0.3);
    float a = smoothstep(1.0 - aa, 1.0 + aa, f);

    // refraction: the grid under the bubble, bent by its surface, split slightly by colour
    vec2 off = -n.xy * 30.0;
    vec3 g = vec3(sheet(p + off).r, sheet(p + off * 1.03).g, sheet(p + off * 1.06).b);
    float fr = pow(1.0 - n.z, 2.5);
    vec3 film = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + (1.0 - n.z) * 1.6 + uTime * 0.04));
    film = mix(vec3(dot(film, vec3(0.333))), film, 0.5);
    g = mix(g, film * 0.9 + 0.1, fr * mix(0.14, 0.22, uDark));
    g *= 1.0 - (0.18 + 0.07 * uDark) * pow(1.0 - n.z, 5.0);
    vec3 L1 = normalize(vec3(-0.5, -0.65, 0.6)), L2 = normalize(vec3(0.55, 0.6, 0.6));
    g += pow(max(dot(reflect(-L1, n), vec3(0.0, 0.0, 1.0)), 0.0), 90.0) * 1.2;
    g += pow(max(dot(reflect(-L2, n), vec3(0.0, 0.0, 1.0)), 0.0), 24.0) * 0.18;
    // on the dark sheet a clear sphere needs its rim lit to read at all
    g += vec3(0.85, 0.88, 0.95) * pow(1.0 - n.z, 3.0) * 0.32 * uDark;
    col = mix(col, g, a);
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

// Critically damped spring, stepped per frame.
function springTo(pos: number, vel: number, target: number, omega: number, dt: number) {
  const x = pos - target;
  const e = Math.exp(-omega * dt);
  return [target + (x + (vel + omega * x) * dt) * e, (vel - omega * (vel + omega * x) * dt) * e];
}

// Bubbles in viewport fractions. `depth` is how fast each rises as you scroll:
// bigger bubbles are nearer, so they move more. Kept to the margins by default.
const BUBBLES = [
  { x: 0.935, y: 0.22, r: 46, depth: 0.42, sx: 0.11, sy: 0.14, ph: 0.3 },
  { x: 0.055, y: 0.7, r: 52, depth: 0.55, sx: 0.09, sy: 0.12, ph: 2.1 },
  { x: 0.9, y: 0.88, r: 26, depth: 0.22, sx: 0.13, sy: 0.1, ph: 4.0 },
  { x: 0.16, y: 0.12, r: 18, depth: 0.14, sx: 0.12, sy: 0.09, ph: 1.4 },
];

// Pointer over any of these means the cursor is reading, not playing: no lens.
const CONTENT = ".glass-panel, .glass-pill, .metal-surface, a, button, img, input, textarea, p, h1, h2, h3, h4, li, [data-no-lens]";

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
      bg: U("uBg"), dot: U("uDot"), dotA: U("uDotA"), dark: U("uDark"), time: U("uTime"),
      mouse: U("uMouse"), mouseOn: U("uMouseOn"), ripple: U("uRipple"), origin: U("uOrigin"),
      intro: U("uIntro"), bub: U("uBub"),
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let w = 0, h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0, last = t0, tick = 0;
    let slowMs = 0;
    let lastScrollY = window.scrollY, lastActive = t0;
    const bub = new Float32Array(NB * 3);

    const mouse = { x: -9999, y: -9999, on: 0, onV: 0, overPaper: false };
    const lensS = { x: 0, y: 0, vx: 0, vy: 0, r: 0, rv: 0 };
    let ripple = { x: 0, y: 0, t: -1 };
    let wave = { x: 0, y: 0, start: reduced ? -99 : t0 };
    waveRef.current = (x, y) => {
      if (reduced) return;
      wave = { x: x ?? w / 2, y: y ?? h * 0.4, start: performance.now() };
      wake();
    };

    const resize = () => {
      dpr = Math.min(dpr, Math.min(window.devicePixelRatio || 1, 2));
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      wave.x ||= w / 2;
      wave.y ||= h * 0.4;
      wake();
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      const t = e.target as Element | null;
      mouse.overPaper = e.pointerType === "mouse" && !(t && t.closest?.(CONTENT));
      wake();
    };
    const onLeave = () => { mouse.overPaper = false; mouse.x = -9999; };
    const onDown = (e: PointerEvent) => {
      lastDown.current = { x: e.clientX, y: e.clientY, t: performance.now() };
      const t = e.target as Element | null;
      if (!(t && t.closest?.(CONTENT))) ripple = { x: e.clientX, y: e.clientY, t: 0 };
      wake();
    };
    const onScroll = () => wake();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);

    function wake() {
      lastActive = performance.now();
      if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }

    function frame(now: number) {
      raf = 0;
      if (document.hidden || !gl) return;
      const scrollY = window.scrollY;
      const scrolling = scrollY !== lastScrollY;
      lastScrollY = scrollY;
      const introT = (now - wave.start) / 1000;
      const busy = scrolling || mouse.onV * mouse.onV > 1e-4 || lensS.rv * lensS.rv > 1e-4 || ripple.t >= 0 || introT < 2.2 || now - lastActive < 400;

      // Nothing but slow drift left to show: 30fps. Nothing at all (reduced motion): stop.
      tick++;
      if (!busy) {
        if (reduced) return;
        if (tick % 2) { raf = requestAnimationFrame(frame); return; }
      }

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;

      // Adaptive resolution: if busy frames keep running long, step the pixel ratio down.
      if (busy && dt > 0.024) slowMs += dt * 1000; else slowMs = Math.max(0, slowMs - dt * 500);
      if (slowMs > 600 && dpr > 1) {
        dpr = Math.max(1, dpr - 0.25);
        slowMs = 0;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      const dark = document.documentElement.classList.contains("dark");
      const pal = dark ? paper.dark : paper.light;

      const pointing = mouse.x > -9000;
      // Plain assignments on purpose: the production minifier constant-folds
      // `[obj.a, obj.b] = f()` on these objects into an invalid `[0, 0] = f()`.
      let sp = springTo(mouse.on, mouse.onV, pointing ? 1 : 0, 9, dt);
      mouse.on = sp[0];
      mouse.onV = sp[1];
      const lensOn = mouse.overPaper ? 1 : 0;
      if (mouse.overPaper) {
        sp = springTo(lensS.x || mouse.x, lensS.vx, mouse.x + 40, 7, dt);
        lensS.x = sp[0];
        lensS.vx = sp[1];
        sp = springTo(lensS.y || mouse.y, lensS.vy, mouse.y + 36, 7, dt);
        lensS.y = sp[0];
        lensS.vy = sp[1];
      }
      sp = springTo(lensS.r, lensS.rv, lensOn * 38, 8, dt);
      lensS.r = sp[0];
      lensS.rv = sp[1];

      // drifting bubbles: they grow in after each navigation and rise with scroll at their own depth
      const grow = reduced ? 1 : Math.min(1, Math.max(0, (introT - 0.35) / 1.0));
      const eased = 1 - Math.pow(1 - grow, 3);
      const scale = Math.min(1, Math.max(0.55, w / 1300));
      const tt = reduced ? 0 : t;
      BUBBLES.forEach((d, i) => {
        const r = d.r * scale;
        const span = h + 4 * r;
        let y = d.y * h + Math.cos(tt * d.sy * 2 + d.ph * 1.3) * 18 - scrollY * d.depth;
        y = ((((y + 2 * r) % span) + span) % span) - 2 * r;
        const x = d.x * w + Math.sin(tt * d.sx * 2 + d.ph) * 14;
        bub[i * 3] = Math.min(w - r - 8, Math.max(r + 8, x));
        bub[i * 3 + 1] = y;
        bub[i * 3 + 2] = r * eased;
      });
      bub[(NB - 1) * 3] = lensS.x;
      bub[(NB - 1) * 3 + 1] = lensS.y;
      bub[(NB - 1) * 3 + 2] = Math.max(0, lensS.r);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, w, h);
      gl.uniform1f(u.dpr, canvas.width / w);
      gl.uniform2f(u.scroll, window.scrollX, scrollY);
      gl.uniform1f(u.gap, paper.gap);
      gl.uniform1f(u.dotR, paper.dotRadius);
      gl.uniform3f(u.bg, pal.bg[0] / 255, pal.bg[1] / 255, pal.bg[2] / 255);
      gl.uniform3f(u.dot, pal.dot[0] / 255, pal.dot[1] / 255, pal.dot[2] / 255);
      gl.uniform1f(u.dotA, pal.dotAlpha);
      gl.uniform1f(u.dark, dark ? 1 : 0);
      gl.uniform1f(u.time, t);
      gl.uniform2f(u.mouse, mouse.x, mouse.y);
      gl.uniform1f(u.mouseOn, Math.max(0, mouse.on));
      if (ripple.t >= 0) { ripple.t += dt; if (ripple.t > 1.6) ripple.t = -1; }
      gl.uniform3f(u.ripple, ripple.x, ripple.y, ripple.t);
      gl.uniform2f(u.origin, wave.x, wave.y);
      gl.uniform1f(u.intro, introT);
      gl.uniform3fv(u.bub, bub);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.style.opacity = "1";

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
        opacity: 0,
      }}
    />
  );
}
