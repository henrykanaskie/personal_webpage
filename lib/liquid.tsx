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
// The blur-and-threshold merge on its own only bridges a gap of a few pixels,
// which a bubble crosses in a frame or two. A drop's neck stretches much further
// before it breaks, so an explicit tether is drawn between the card's edge and
// the bubble: it thins as the gap opens, snaps at SNAP px, and both stubs pull
// back into their own side. The merge filter turns card, tether and bubble into
// one continuous liquid outline; a mask then removes everything the card and
// the bubble already cover, so only the neck is ever painted.

const GOO_MS = 1500;
const SNAP = 90; // px of gap at which the neck breaks
const RETRACT_MS = 200;
const INSET = 8; // goo shapes sit inside the real glass by the threshold's spread

export function LiquidBud({
  bubbleRef,
  radius = 24,
}: {
  /** The bubble; its offsetParent must be the overlay that covers the card. */
  bubbleRef: React.RefObject<HTMLElement | null>;
  radius?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const cardRef = useRef<SVGRectElement>(null);
  const budRef = useRef<SVGRectElement>(null);
  const neckRef = useRef<SVGRectElement>(null);
  const stubARef = useRef<SVGRectElement>(null);
  const stubBRef = useRef<SVGRectElement>(null);
  const cardMaskRef = useRef<SVGRectElement>(null);
  const budMaskRef = useRef<SVGRectElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    let snappedAt = -1;
    let snapThick = 0;
    const PAD = 400; // the svg extends past the card so the neck can reach the bubble
    const set = (el: SVGRectElement | null, x: number, y: number, w: number, h: number, rr: number) => {
      if (!el) return;
      el.setAttribute("x", String(x));
      el.setAttribute("y", String(y));
      el.setAttribute("width", String(Math.max(0, w)));
      el.setAttribute("height", String(Math.max(0, h)));
      el.setAttribute("rx", String(Math.max(0, Math.min(rr, w / 2, h / 2))));
    };
    // A bar between the card's edge and the bubble's, along whichever axis separates them.
    const bar = (el: SVGRectElement | null, horizontal: boolean, from: number, to: number, center: number, thick: number) => {
      const a = Math.min(from, to), len = Math.abs(to - from);
      if (horizontal) set(el, a, center - thick / 2, len, thick, thick / 2);
      else set(el, center - thick / 2, a, thick, len, thick / 2);
    };

    const tick = (now: number) => {
      const bubble = bubbleRef.current;
      const host = bubble?.offsetParent as HTMLElement | null;
      const svg = svgRef.current;
      if (bubble && host && svg) {
        const hr = host.getBoundingClientRect();
        const br = bubble.getBoundingClientRect();
        // card and bubble in svg space
        const c = { l: PAD, t: PAD, r: PAD + hr.width, b: PAD + hr.height };
        const u = { l: br.left - hr.left + PAD, t: br.top - hr.top + PAD, r: br.right - hr.left + PAD, b: br.bottom - hr.top + PAD };
        const gapX = Math.max(c.l - u.r, u.l - c.r, 0);
        const gapY = Math.max(c.t - u.b, u.t - c.b, 0);
        const horizontal = gapX >= gapY;
        const gap = Math.max(gapX, gapY);
        const elapsed = now - t0;

        set(cardRef.current, c.l + INSET, c.t + INSET, hr.width - 2 * INSET, hr.height - 2 * INSET, radius);
        set(budRef.current, u.l + INSET, u.t + INSET, br.width - 2 * INSET, br.height - 2 * INSET, radius * (br.width / (bubble.offsetWidth || br.width)));
        set(cardMaskRef.current, c.l, c.t, hr.width, hr.height, radius);
        set(budMaskRef.current, u.l, u.t, br.width, br.height, radius);

        // where the neck attaches: the bubble's centre line, kept inside the card's straight edge
        const center = horizontal
          ? Math.min(c.b - radius, Math.max(c.t + radius, (u.t + u.b) / 2))
          : Math.min(c.r - radius, Math.max(c.l + radius, (u.l + u.r) / 2));
        const cardEdge = horizontal ? (u.l > c.r ? c.r - INSET : c.l + INSET) : u.t > c.b ? c.b - INSET : c.t + INSET;
        const budEdge = horizontal ? (u.l > c.r ? u.l + INSET : u.r - INSET) : u.t > c.b ? u.t + INSET : u.b - INSET;
        const thickMax = Math.min(90, (horizontal ? br.height : br.width) * 0.55);

        if (snappedAt < 0 && (gap > SNAP || elapsed > GOO_MS * 0.75)) {
          snappedAt = now;
          snapThick = thickMax * Math.pow(Math.max(0, 1 - gap / SNAP), 0.6) + 10;
        }
        if (snappedAt < 0) {
          // stretching: the neck thins as the gap opens
          const thick = thickMax * Math.pow(Math.max(0, 1 - gap / SNAP), 0.6) + 10;
          bar(neckRef.current, horizontal, cardEdge, budEdge, center, gap > 0 ? thick : 0);
          set(stubARef.current, 0, 0, 0, 0, 0);
          set(stubBRef.current, 0, 0, 0, 0, 0);
        } else {
          // snapped: two stubs pull back into the card and the bubble
          set(neckRef.current, 0, 0, 0, 0, 0);
          const k = Math.min(1, (now - snappedAt) / RETRACT_MS);
          const ease = 1 - (1 - k) * (1 - k) * (1 - k);
          const len = 30 * (1 - ease), th = snapThick * (1 - ease);
          const dir = Math.sign(budEdge - cardEdge) || 1;
          const budCenter = horizontal ? (u.t + u.b) / 2 : (u.l + u.r) / 2;
          bar(stubARef.current, horizontal, cardEdge, cardEdge + dir * len, center, th);
          bar(stubBRef.current, horizontal, budEdge, budEdge - dir * len, budCenter, th);
        }
        const fadeFrom = snappedAt < 0 ? Infinity : snappedAt + RETRACT_MS;
        svg.style.opacity = String(Math.max(0, 1 - Math.max(0, now - fadeFrom) / 150));
      }
      if (now - t0 < GOO_MS + 400 && !(snappedAt >= 0 && now - snappedAt > RETRACT_MS + 160)) raf = requestAnimationFrame(tick);
      else setDone(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [bubbleRef, radius]);

  if (done) return null;
  return (
    <svg
      ref={svgRef}
      aria-hidden
      style={{ position: "absolute", left: -400, top: -400, width: "calc(100% + 800px)", height: "calc(100% + 800px)", pointerEvents: "none", overflow: "visible" }}
    >
      <defs>
        <filter id={`goo-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="b" />
          <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -6" result="goo" />
          {/* glass reads through its edge and its shadow, not its fill: a hairline rim... */}
          <feMorphology in="goo" operator="erode" radius="1.2" result="inner" />
          <feComposite in="goo" in2="inner" operator="out" result="edge" />
          <feFlood style={{ floodColor: "var(--bud-rim)" }} result="rimColor" />
          <feComposite in="rimColor" in2="edge" operator="in" result="rim" />
          {/* ...and the same soft shadow the bubble casts */}
          <feGaussianBlur in="goo" stdDeviation="8" result="sb" />
          <feOffset in="sb" dy="10" result="so" />
          <feFlood style={{ floodColor: "var(--bud-shadow)" }} result="shadowColor" />
          <feComposite in="shadowColor" in2="so" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="goo" />
            <feMergeNode in="rim" />
          </feMerge>
        </filter>
        <mask id={`neck-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
          <rect x="0" y="0" width="100%" height="100%" fill="#fff" />
          <rect ref={cardMaskRef} fill="#000" />
          <rect ref={budMaskRef} fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#neck-${uid})`}>
        <g filter={`url(#goo-${uid})`} style={{ fill: "var(--bud-fill)" }}>
          <rect ref={cardRef} />
          <rect ref={budRef} />
          <rect ref={neckRef} />
          <rect ref={stubARef} />
          <rect ref={stubBRef} />
        </g>
      </g>
    </svg>
  );
}
