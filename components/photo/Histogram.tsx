"use client";

import { motion } from "framer-motion";
import type { PhotoHistogram } from "@/app/photography/data";

const W = 240;
const H = 72;

function areaPath(bins: number[]): string {
  if (bins.length === 0) return `M0,${H} L${W},${H} Z`;
  const step = W / (bins.length - 1);
  const pts = bins.map((v, i) => `L${(i * step).toFixed(1)},${(H - (v / 100) * (H - 4)).toFixed(1)}`);
  return `M0,${H} ${pts.join(" ")} L${W},${H} Z`;
}

function linePath(bins: number[]): string {
  if (bins.length === 0) return `M0,${H} L${W},${H}`;
  const step = W / (bins.length - 1);
  return bins.map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)},${(H - (v / 100) * (H - 4)).toFixed(1)}`).join(" ");
}

const morph = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

/**
 * RGB + luminance histogram, computed at build time from the photo's pixels.
 * Paths keep the same point count between photos, so they morph smoothly.
 */
export default function Histogram({ hist, isDark }: { hist: PhotoHistogram; isDark: boolean }) {
  const blend = isDark ? "screen" : "multiply";
  const channels: [keyof PhotoHistogram, string][] = isDark
    ? [
        ["r", "rgba(255,70,90,0.55)"],
        ["g", "rgba(70,230,140,0.5)"],
        ["b", "rgba(90,130,255,0.6)"],
      ]
    : [
        ["r", "rgba(235,60,80,0.4)"],
        ["g", "rgba(40,170,100,0.36)"],
        ["b", "rgba(60,90,230,0.4)"],
      ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }} aria-hidden>
      {/* Zone grid: shadows, midtones, highlights */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={W * f}
          x2={W * f}
          y1={0}
          y2={H}
          stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}
          strokeDasharray="2 3"
        />
      ))}
      <g style={{ isolation: "isolate" }}>
        {channels.map(([k, fill]) => (
          <motion.path
            key={k}
            initial={false}
            animate={{ d: areaPath(hist[k]) }}
            transition={morph}
            fill={fill}
            style={{ mixBlendMode: blend }}
          />
        ))}
      </g>
      <motion.path
        initial={false}
        animate={{ d: linePath(hist.l) }}
        transition={morph}
        fill="none"
        stroke={isDark ? "rgba(255,255,255,0.75)" : "rgba(40,28,50,0.7)"}
        strokeWidth={1}
      />
      <line x1={0} x2={W} y1={H} y2={H} stroke={isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)"} />
    </svg>
  );
}
