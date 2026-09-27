"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import AnimatedSvg from "./AnimatedSvg";

type Offset = { x?: number; y?: number };

/**
 * A section title in chrome lettering (.metal-text), optionally flanked by a
 * steel-wire line drawing on each side that draws itself once the title is in
 * view. The right-hand drawing is mirrored.
 */
export default function GlassTitle({
  text,
  svgPathsLeft = [],
  svgPathsRight = [],
  svgRotateLeft = 0,
  svgRotateRight = 0,
  svgOffsetLeft = { x: 0, y: 0 },
  svgOffsetRight = { x: 0, y: 0 },
  svgSizeLeft = 80,
  svgSizeRight = 80,
  fontSize,
  containerClassName,
  disableEntrance = false,
  noWrap = false,
}: {
  text: string;
  svgPathsLeft?: string[];
  svgPathsRight?: string[];
  svgRotateLeft?: number;
  svgRotateRight?: number;
  svgOffsetLeft?: Offset;
  svgOffsetRight?: Offset;
  svgSizeLeft?: number;
  svgSizeRight?: number;
  fontSize?: string;
  containerClassName?: string;
  disableEntrance?: boolean;
  noWrap?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(() => setDrawn(true), 400);
    return () => clearTimeout(timer);
  }, [isInView]);

  return (
    <motion.div
      ref={ref}
      initial={disableEntrance ? false : { opacity: 0, y: 20 }}
      animate={disableEntrance || isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      style={{ willChange: "transform, opacity" }}
      className={`flex justify-center items-center pt-12 md:pt-18 pb-4 md:pb-8 select-none ${containerClassName ?? ""}`}
    >
      {/* Left drawing: overlaps into the text with a negative margin */}
      {svgPathsLeft.length > 0 && (
        <div
          className="pointer-events-none hidden md:flex items-center shrink-0"
          style={{
            marginRight: "clamp(-20px, -2.5vw, -30px)",
            transform: `translate(${svgOffsetLeft.x ?? 0}px, ${svgOffsetLeft.y ?? 0}px)`,
          }}
        >
          <AnimatedSvg paths={svgPathsLeft} size={svgSizeLeft} drawn={drawn} rotate={svgRotateLeft} />
        </div>
      )}

      <span
        className="relative font-[family-name:var(--font-elevated)] font-extrabold tracking-tight leading-none"
        style={{
          fontSize: fontSize ?? "clamp(4rem, 11vw, 10rem)",
          letterSpacing: "-0.02em",
          zIndex: 1,
          whiteSpace: noWrap ? "nowrap" : "pre-line",
          display: "inline-block",
        }}
      >
        <span className="relative metal-text">{text}</span>
      </span>

      {/* Right drawing: overlaps into the text with a negative margin, mirrored */}
      {svgPathsRight.length > 0 && (
        <div
          className="pointer-events-none hidden md:flex items-center shrink-0"
          style={{
            marginLeft: "clamp(-20px, -2.5vw, -30px)",
            transform: `scaleX(-1) translate(${svgOffsetRight.x ?? 0}px, ${svgOffsetRight.y ?? 0}px)`,
          }}
        >
          <AnimatedSvg paths={svgPathsRight} size={svgSizeRight} drawn={drawn} rotate={svgRotateRight} />
        </div>
      )}
    </motion.div>
  );
}
