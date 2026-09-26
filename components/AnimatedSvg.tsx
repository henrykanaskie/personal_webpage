"use client";

import { memo, useId, useRef, useState } from "react";
import { MotionValue, useMotionValueEvent } from "framer-motion";

interface AnimatedSvgProps {
  paths: string[];
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  /** Drawing starts the first time this moves above zero. */
  scrollProgress: MotionValue<number>;
  className?: string;
  rotate?: number;
  /** Seconds the line drawing takes. */
  duration?: number;
}

// Line drawings draw themselves once, the first time they're asked to, and stay
// drawn. The stroke animation is a CSS transition (see `.line-draw` in
// globals.css) started by a single class change: it used to be one JS-driven
// motion value per path, which on the CS page meant ~1,200 style writes a
// frame, repeated every time a drawing scrolled out and back in.
function AnimatedSvg({
  paths,
  size = 240,
  color,
  strokeWidth = 2,
  scrollProgress,
  className = "",
  rotate = 0,
  duration = 3,
}: AnimatedSvgProps) {
  const [drawn, setDrawn] = useState(() => scrollProgress.get() > 0.001);
  const drawnRef = useRef(drawn);
  useMotionValueEvent(scrollProgress, "change", (v) => {
    if (!drawnRef.current && v > 0.001) {
      drawnRef.current = true;
      setDrawn(true);
    }
  });

  // Steel wire: a stroke gradient that reflects back and forth along a short
  // diagonal, so glints run along the lines like light on drawn metal.
  const wireId = `wire-${useId().replace(/:/g, "")}`;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      <svg viewBox="500 300 136 112" style={{ width: "100%", height: "100%", overflow: "visible" }}>
        {!color && (
          <defs>
            <linearGradient id={wireId} gradientUnits="userSpaceOnUse" x1="500" y1="300" x2="524" y2="318" spreadMethod="reflect">
              <stop offset="0" style={{ stopColor: "var(--wire-hi)" }} />
              <stop offset="0.45" style={{ stopColor: "var(--wire-mid)" }} />
              <stop offset="0.55" style={{ stopColor: "var(--wire-lo)" }} />
              <stop offset="1" style={{ stopColor: "var(--wire-mid)" }} />
            </linearGradient>
          </defs>
        )}
        <g
          className={`line-draw${drawn ? " drawn" : ""}`}
          stroke={color ?? `url(#${wireId})`}
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
