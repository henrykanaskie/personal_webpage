"use client";

import { memo, useEffect, useId, useRef, useState } from "react";
import { useIsDark } from "@/hooks/useIsDark";
import { rasterDrawing, registerDrawing } from "@/lib/drawings";

interface AnimatedSvgProps {
  paths: string[];
  size?: number | string;
  strokeWidth?: number;
  /** Drawing starts the first time this turns true, and never reverses. */
  drawn: boolean;
  rotate?: number;
  /** Seconds the line drawing takes. */
  duration?: number;
}

// ─── Iridescent chrome ──────────────────────────────────────────────────────
// The strokes are painted from a texture, not a gradient: steel with soft,
// drifting patches of thin-film colour (the glass edge's pink, violet, cyan
// and gold, in the order a thinning film throws them), like the sheen on
// heat-tinted or anodised metal. The patches come from low-frequency noise,
// so the colour has no direction to it: nothing reads as a band or a sweep.
// Built once per theme and shared by every drawing (an image pattern costs
// nothing per frame while the lines draw, unlike an SVG filter).

// The pattern covers the drawings' viewBox (500 300 136 112) with a margin, as
// paths run past it.
const TEX = { x: 440, y: 240, w: 256, h: 232, scale: 2 };
const FILM = [
  [255, 150, 205],
  [185, 160, 255],
  [120, 205, 255],
  [255, 220, 140],
];
const texCache: { light?: string; dark?: string } = {};

function wireTexture(dark: boolean): string {
  const key = dark ? "dark" : "light";
  if (texCache[key]) return texCache[key]!;
  const W = TEX.w * TEX.scale, H = TEX.h * TEX.scale;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  // smooth value noise on a coarse lattice, fixed seed so it's the same on every load
  const N = 16;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const lat = Array.from({ length: N * N }, rnd);
  const at = (i: number, j: number) => lat[(((j % N) + N) % N) * N + (((i % N) + N) % N)];
  const noise = (x: number, y: number) => {
    const i = Math.floor(x), j = Math.floor(y);
    const fx = x - i, fy = y - j;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * ux;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * ux;
    return a + (b - a) * uy;
  };
  const img = ctx.createImageData(W, H);
  // steel the film sits on, and how much colour it throws
  const base = dark ? [226, 223, 217] : [58, 56, 52];
  const tint = dark ? 0.36 : 0.5;
  const shade = dark ? 1 : 0.5; // on the light sheet the colour is darkened to stay legible
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const x = px / TEX.scale, y = py / TEX.scale;
      // film thickness: two octaves, two or three broad patches across a drawing
      const t = noise(x / 52, y / 52) * 0.8 + noise(x / 21 + 5.3, y / 21 + 1.7) * 0.2;
      // polish: a slow brightness variation, the metal catching light unevenly
      const gloss = noise(x / 22 + 9.1, y / 22 + 3.4);
      const f = (t * 1.25) % 1 * FILM.length;
      const k = Math.floor(f), m = f - k;
      const p = FILM[k % FILM.length], q = FILM[(k + 1) % FILM.length];
      const e = m * m * (3 - 2 * m);
      const o = (py * W + px) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const film = (p[ch] + (q[ch] - p[ch]) * e) * shade;
        const v = base[ch] + (film - base[ch]) * tint;
        img.data[o + ch] = Math.max(0, Math.min(255, v * (dark ? 0.86 + 0.18 * gloss : 0.8 + 0.45 * gloss)));
      }
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return (texCache[key] = c.toDataURL());
}

// Line drawings draw themselves once, the first time they're asked to, and stay
// drawn. The stroke animation is a CSS transition (see `.line-draw` in
// globals.css) started by a single class change: it used to be one JS-driven
// motion value per path, which on the CS page meant ~1,200 style writes a
// frame, repeated every time a drawing scrolled out and back in.
function AnimatedSvg({ paths, size = 240, strokeWidth = 0.8, drawn, rotate = 0, duration = 3 }: AnimatedSvgProps) {
  const wireId = `wire-${useId().replace(/:/g, "")}`;
  const dark = useIsDark();
  // the stroke pattern, tagged with the theme it was built for
  const [wire, setWire] = useState<{ dark: boolean; url: string } | null>(null);
  useEffect(() => {
    setWire({ dark, url: wireTexture(dark) });
  }, [dark]);
  const tex = wire?.url ?? null;

  // Once it has finished drawing itself, the drawing is handed to the paper
  // (lib/drawings), so DotField's glass can frost and bend it. DotField asks
  // for a raster when it needs one; the SVG stays until it's painting it.
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const unregister = useRef<(() => void) | null>(null);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!drawn || settled) return;
    const t = window.setTimeout(() => setSettled(true), duration * 1000 + 150);
    return () => window.clearTimeout(t);
  }, [drawn, settled, duration]);
  useEffect(() => {
    const svg = svgRef.current, g = gRef.current;
    if (!settled || !svg || !g || unregister.current) return;
    const bb = g.getBBox();
    // room past the last stroke for the glass's blur and lens to fade into
    const pad = strokeWidth * 2 + 6;
    const box = { x: bb.x - pad, y: bb.y - pad, w: bb.width + pad * 2, h: bb.height + pad * 2 };
    unregister.current = registerDrawing({
      svg,
      box,
      raster: (dark) => {
        // about one texel per device pixel at the drawing's size right now
        const m = svg.getScreenCTM();
        const scale = m ? Math.hypot(m.a, m.b) : 3;
        return rasterDrawing(svg, box, scale * Math.min(window.devicePixelRatio || 1, 2), wireTexture(dark));
      },
    });
  }, [settled, strokeWidth]);
  useEffect(() => () => unregister.current?.(), []);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      <svg ref={svgRef} viewBox="500 300 136 112" style={{ width: "100%", height: "100%", overflow: "visible" }}>
        {tex && (
          <defs>
            <pattern id={wireId} patternUnits="userSpaceOnUse" x={TEX.x} y={TEX.y} width={TEX.w} height={TEX.h}>
              <image href={tex} x={0} y={0} width={TEX.w} height={TEX.h} preserveAspectRatio="none" />
            </pattern>
          </defs>
        )}
        <g
          ref={gRef}
          className={`line-draw${drawn ? " drawn" : ""}`}
          stroke={tex ? `url(#${wireId})` : "var(--wire-mid)"}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ "--draw-dur": `${duration}s` } as React.CSSProperties}
        >
          {paths.map((path, index) => (
            <path key={index} d={path} pathLength={1} />
          ))}
        </g>
      </svg>
    </div>
  );
}

export default memo(AnimatedSvg);
