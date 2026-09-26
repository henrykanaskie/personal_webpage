"use client";

import { useEffect, useRef } from "react";
import { paper } from "@/lib/tokens";

// ─── DotField ───────────────────────────────────────────────────────────────
// The page's dot grid, redrawn in WebGL over a region so it can move:
//   - dots swell and part around the cursor
//   - on first paint the grid configures itself in a wave from `origin`
//   - a click sends a ripple through the dots
//   - glass bubbles drift over the sheet and refract the grid under them, and
//     one of them follows the cursor as a lens
//
// It paints its own paper and dots at exactly the page offset of the CSS ones
// (lib/tokens `paper`), so the canvas edge is invisible. Anything that goes
// wrong (no WebGL, a lost context) just leaves the CSS grid showing.

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const NB = 5; // bubbles, the last one is the cursor lens

const FRAG = `
precision highp float;
uniform vec2 uRes;        // css px
uniform float uDpr;
uniform vec2 uOffset;     // page position of the canvas' top-left, css px
uniform float uGap, uDotR;
uniform vec3 uBg, uDot;
uniform float uDotA, uDark, uTime;
uniform vec2 uMouse;      // css px, local
uniform float uMouseOn;
uniform vec3 uRipple;     // x, y, seconds since click
uniform vec2 uOrigin;     // where the intro wave starts
uniform float uIntro;     // seconds since mount
uniform vec3 uBub[${NB}];

float edgeFeather(vec2 p) {
  vec2 d = min(p, uRes - p);
  return smoothstep(0.0, 90.0, min(d.x, d.y));
}

// Coverage of the dot grid at local point p, with every per-dot effect applied.
float dots(vec2 p) {
  vec2 w = p + uOffset;
  vec2 base = floor(w / uGap);
  float cov = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 c = (base + vec2(float(i), float(j)) + 0.5) * uGap - uOffset;
      float feather = edgeFeather(c);
      float r = uDotR;
      vec2 shift = vec2(0.0);

      // cursor: dots nearby swell and step aside
      vec2 tm = c - uMouse;
      float dm = length(tm);
      float near = exp(-dm * dm / (2.0 * 80.0 * 80.0)) * uMouseOn * feather;
      r += 1.35 * near;
      shift += (dm > 0.5 ? tm / dm : vec2(0.0)) * 7.0 * near;

      // intro: a wave from the origin; each dot arrives slightly large, then settles
      float dO = length(c - uOrigin);
      float t0 = dO / 1300.0;
      float k = clamp((uIntro - t0) / 0.55, 0.0, 1.0);
      float grow = 1.0 - pow(1.0 - k, 3.0);
      float pop = sin(3.14159 * k) * 0.9;
      float introMix = feather;
      r = mix(r, r * grow + pop, introMix);
      vec2 dirO = dO > 0.5 ? (c - uOrigin) / dO : vec2(0.0);
      shift -= dirO * 10.0 * (1.0 - grow) * introMix;

      // click ripple
      if (uRipple.z >= 0.0 && uRipple.z < 1.8) {
        float dr = length(c - uRipple.xy);
        float front = dr - 700.0 * uRipple.z;
        float amp = exp(-front * front / 1800.0) * exp(-uRipple.z * 1.6) * feather;
        r += 1.5 * amp;
        shift += (dr > 0.5 ? (c - uRipple.xy) / dr : vec2(0.0)) * 6.0 * amp;
      }

      float d = length(p - (c + shift));
      float aa = 0.6 / uDpr + 0.25;
      cov = max(cov, smoothstep(r + aa, r - aa, d));
    }
  }
  return cov;
}

vec3 sheet(vec2 p) {
  float a = dots(p) * uDotA;
  return mix(uBg, uDot, a);
}

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

  // bubbles cast a soft shadow on the sheet, with the caustic a lens focuses into it
  for (int i = 0; i < ${NB}; i++) {
    vec3 b = uBub[i];
    if (b.z < 0.5) continue;
    vec2 sp = p - (b.xy + vec2(b.z * 0.2, b.z * 0.6));
    col *= 1.0 - (0.10 - 0.04 * uDark) * exp(-dot(sp, sp) / (b.z * b.z * 0.5));
    vec2 cp = p - (b.xy + vec2(b.z * 0.18, b.z * 0.5));
    col += (0.08 - 0.05 * uDark) * exp(-dot(cp, cp) / (b.z * b.z * 0.045));
  }

  float f = bfield(p);
  if (f > 0.3) {
    float e = 1.0;
    float fx = bfield(p + vec2(e, 0.0)), fy = bfield(p + vec2(0.0, e));
    float h = bh(f);
    vec3 n = normalize(vec3(-(bh(fx) - h) / e * 55.0, -(bh(fy) - h) / e * 55.0, 1.0));
    float aa = clamp(length(vec2(fx - f, fy - f)) / e * 0.9 * uDpr, 1e-4, 0.3);
    float a = smoothstep(1.0 - aa, 1.0 + aa, f);

    // refraction: the grid under the bubble, bent by its surface, split a little by colour
    vec2 off = -n.xy * 30.0;
    vec3 g = vec3(sheet(p + off).r, sheet(p + off * 1.03).g, sheet(p + off * 1.06).b);
    float fr = pow(1.0 - n.z, 2.5);
    vec3 film = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + (1.0 - n.z) * 1.6 + uTime * 0.04));
    film = mix(vec3(dot(film, vec3(0.333))), film, 0.5);
    g = mix(g, film * 0.9 + 0.1, fr * mix(0.14, 0.22, uDark));
    g = mix(g, uDark > 0.5 ? g * 0.75 : g * 0.82, pow(1.0 - n.z, 5.0));
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

type Vec2 = { x: number; y: number };

// Critically damped spring, stepped: for the lens chasing the cursor.
function springTo(pos: number, vel: number, target: number, omega: number, dt: number) {
  const x = pos - target;
  const e = Math.exp(-omega * dt);
  const nx = (x + (vel + omega * x) * dt) * e;
  const nv = (vel - omega * (vel + omega * x) * dt) * e;
  return [target + nx, nv];
}

export default function DotField({
  className = "",
  style,
  origin,
  bubbles = true,
  lens = true,
}: {
  className?: string;
  style?: React.CSSProperties;
  /** Intro wave origin, as a fraction of the canvas size. */
  origin?: Vec2;
  bubbles?: boolean;
  lens?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originRef = useRef<Vec2>(origin ?? { x: 0.5, y: 0.5 });
  originRef.current = origin ?? { x: 0.5, y: 0.5 };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const canvas: HTMLCanvasElement = el;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
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
      return; // CSS dots stay visible underneath
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      res: U("uRes"), dpr: U("uDpr"), offset: U("uOffset"), gap: U("uGap"), dotR: U("uDotR"),
      bg: U("uBg"), dot: U("uDot"), dotA: U("uDotA"), dark: U("uDark"), time: U("uTime"),
      mouse: U("uMouse"), mouseOn: U("uMouseOn"), ripple: U("uRipple"), origin: U("uOrigin"),
      intro: U("uIntro"), bub: U("uBub"),
    };
    canvas.dataset.ready = "1";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let w = 0, h = 0, dpr = 1;
    let visible = true;
    let raf = 0;
    let last = t0;
    let tick = 0;

    const mouse = { x: -9999, y: -9999, on: 0, onV: 0, inside: false };
    const lensS = { x: 0, y: 0, vx: 0, vy: 0, r: 0, rv: 0 };
    let ripple = { x: 0, y: 0, t: -1 };

    // Four drifting bubbles on slow Lissajous paths, in fractions of the canvas.
    const drift = [
      { ax: 0.94, ay: 0.24, rx: 0.02, ry: 0.06, sx: 0.11, sy: 0.14, r: 40, ph: 0.3 },
      { ax: 0.86, ay: 0.86, rx: 0.05, ry: 0.04, sx: 0.09, sy: 0.12, r: 56, ph: 2.1 },
      { ax: 0.07, ay: 0.84, rx: 0.03, ry: 0.05, sx: 0.13, sy: 0.1, r: 42, ph: 4.0 },
      { ax: 0.34, ay: 0.93, rx: 0.07, ry: 0.02, sx: 0.07, sy: 0.16, r: 24, ph: 5.2 },
    ];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      if (!lensS.x) { lensS.x = rect.width * 0.7; lensS.y = rect.height * 0.5; }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Pointer events are read off the window so content layered above still drives the field.
    const local = (e: PointerEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = w / (rect.width || 1), sy = h / (rect.height || 1);
      return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy, rect };
    };
    const onMove = (e: PointerEvent) => {
      const { x, y, rect } = local(e);
      mouse.x = x; mouse.y = y;
      mouse.inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    };
    const onLeave = () => { mouse.inside = false; };
    const onDown = (e: PointerEvent) => {
      const { x, y } = local(e);
      if (mouse.inside) ripple = { x, y, t: 0 };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
    io.observe(canvas);
    const onVis = () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };
    document.addEventListener("visibilitychange", onVis);

    function frame(now: number) {
      raf = 0;
      if (!visible || !gl) return;
      // Once the intro has played and nobody is pointing at it, the field only
      // has slow drift left to show: draw every other frame to spare the battery.
      tick++;
      if (!mouse.inside && mouse.on < 0.01 && ripple.t < 0 && now - t0 > 3000 && tick % 2) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;

      const dark = document.documentElement.classList.contains("dark");
      const pal = dark ? paper.dark : paper.light;

      // the cursor's influence fades in and out on a spring, never snaps
      [mouse.on, mouse.onV] = springTo(mouse.on, mouse.onV, mouse.inside ? 1 : 0, 9, dt);
      const lensOn = lens && mouse.inside ? 1 : 0;
      if (mouse.inside) {
        [lensS.x, lensS.vx] = springTo(lensS.x, lensS.vx, mouse.x + 46, 7, dt);
        [lensS.y, lensS.vy] = springTo(lensS.y, lensS.vy, mouse.y + 40, 7, dt);
      }
      [lensS.r, lensS.rv] = springTo(lensS.r, lensS.rv, lensOn * 44, 8, dt);

      const b = new Float32Array(NB * 3);
      if (bubbles) {
        const tt = reduced ? 0 : t;
        const grow = reduced ? 1 : Math.min(1, Math.max(0, (t - 0.6) / 1.1));
        const eased = 1 - Math.pow(1 - grow, 3);
        drift.forEach((d, i) => {
          b[i * 3] = w * (d.ax + d.rx * Math.sin(tt * d.sx * 2 + d.ph));
          b[i * 3 + 1] = h * (d.ay + d.ry * Math.cos(tt * d.sy * 2 + d.ph * 1.3));
          const scale = Math.min(1, Math.max(0.6, w / 1200));
          b[i * 3 + 2] = d.r * scale * eased;
          // keep every bubble whole: the canvas edge would slice it
          const m = d.r * scale + 12;
          b[i * 3] = Math.min(w - m, Math.max(m, b[i * 3]));
          b[i * 3 + 1] = Math.min(h - m, Math.max(m, b[i * 3 + 1]));
        });
      }
      b[(NB - 1) * 3] = Math.min(w - 60, Math.max(60, lensS.x));
      b[(NB - 1) * 3 + 1] = Math.min(h - 60, Math.max(60, lensS.y));
      b[(NB - 1) * 3 + 2] = Math.max(0, lensS.r);

      const rect = canvas.getBoundingClientRect();
      const offX = rect.left + window.scrollX, offY = rect.top + window.scrollY;
      const org = originRef.current;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, w, h);
      gl.uniform1f(u.dpr, dpr);
      gl.uniform2f(u.offset, offX, offY);
      gl.uniform1f(u.gap, paper.gap);
      gl.uniform1f(u.dotR, paper.dotRadius);
      gl.uniform3f(u.bg, pal.bg[0] / 255, pal.bg[1] / 255, pal.bg[2] / 255);
      gl.uniform3f(u.dot, pal.dot[0] / 255, pal.dot[1] / 255, pal.dot[2] / 255);
      gl.uniform1f(u.dotA, pal.dotAlpha);
      gl.uniform1f(u.dark, dark ? 1 : 0);
      gl.uniform1f(u.time, t);
      gl.uniform2f(u.mouse, mouse.x, mouse.y);
      gl.uniform1f(u.mouseOn, Math.max(0, mouse.on));
      if (ripple.t >= 0) ripple.t += dt;
      gl.uniform3f(u.ripple, ripple.x, ripple.y, ripple.t);
      gl.uniform2f(u.origin, w * org.x, h * org.y);
      gl.uniform1f(u.intro, reduced ? 99 : t);
      gl.uniform3fv(u.bub, b);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [bubbles, lens]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ display: "block", width: "100%", height: "100%", pointerEvents: "none", ...style }}
    />
  );
}
