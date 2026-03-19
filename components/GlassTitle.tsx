"use client";

import { useRef, useEffect } from "react";
import { motion, useInView, useMotionValue, animate } from "framer-motion";
import AnimatedSvg from "./AnimatedSvg";
import { useIsDark } from "../lib/glass";
import { cs, themed } from "../lib/tokens";

export default function GlassTitle({
  text = "experience",
  svgPaths = [],
  svgPathsLeft,
  svgPathsRight,
  svgRotateLeft = 0,
  svgRotateRight = 0,
  svgOffsetLeft = { x: 0, y: 0 },
  svgOffsetRight = { x: 0, y: 0 },
  svgSizeRight = 80,
  svgSizeLeft = 80,
}: {
  text?: string;
  svgPaths?: string[];
  svgPathsLeft?: string[];
  svgPathsRight?: string[];
  svgRotateLeft?: number;
  svgRotateRight?: number;
  svgOffsetLeft?: { x?: number; y?: number };
  svgOffsetRight?: { x?: number; y?: number };
  svgSizeRight?: number;
  svgSizeLeft?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isDark = useIsDark();
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  const svgProgress = useMotionValue(0);
  const drawTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isInView) {
      if (drawTimer.current) clearTimeout(drawTimer.current);
      drawTimer.current = setTimeout(() => {
        animate(svgProgress, 1, { duration: 3, ease: "easeInOut" });
        drawTimer.current = null;
      }, 400);
    } else {
      if (drawTimer.current) clearTimeout(drawTimer.current);
      drawTimer.current = null;
      animate(svgProgress, 0, { duration: 1.8, ease: "easeInOut" });
    }
    return () => {
      if (drawTimer.current) clearTimeout(drawTimer.current);
    };
  }, [isInView, svgProgress]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className="flex justify-center items-center pt-12 md:pt-18 pb-4 md:pb-8 select-none"
    >
      {/* Left SVG — overlaps into text with negative margin */}
      <div
        className="pointer-events-none hidden md:flex items-center shrink-0"
        style={{
          marginRight: "clamp(-20px, -2.5vw, -30px)",
          transform: `translate(${svgOffsetLeft.x ?? 0}px, ${svgOffsetLeft.y ?? 0}px)`,
        }}
      >
        <AnimatedSvg
          paths={svgPathsLeft ?? svgPaths}
          size={svgSizeLeft}
          strokeWidth={0.8}
          scrollProgress={svgProgress}
          rotate={svgRotateLeft}
        />
      </div>

      <span
        className="relative font-extrabold tracking-tight leading-none"
        style={{
          fontSize: "clamp(4rem, 11vw, 10rem)",
          letterSpacing: "-0.02em",
          zIndex: 1,
        }}
      >
        {/* Iridescent text */}
        <span
          className="relative bg-clip-text text-transparent"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: themed(isDark, cs.iridescent.dark, cs.iridescent.light),
            textShadow: themed(isDark, cs.titleShadow.dark, cs.titleShadow.light),
          }}
        >
          {text}
        </span>

        {/* Shine — plays once on load */}
        <span
          aria-hidden
          className="absolute inset-0 -bottom-[0.15em] bg-clip-text text-transparent pointer-events-none"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: `linear-gradient(
              105deg,
              transparent 0%,
              transparent 35%,
              rgba(255,255,255,0.25) 45%,
              rgba(255,255,255,0.35) 50%,
              rgba(255,255,255,0.25) 55%,
              transparent 65%,
              transparent 100%
            )`,
            backgroundSize: "250% 100%",
            animation: "glassShineIntro 2.5s ease-in-out forwards",
          }}
        >
          {text}
        </span>
      </span>

      {/* Right SVG — overlaps into text with negative margin, mirrored */}
      <div
        className="pointer-events-none hidden md:flex items-center shrink-0"
        style={{
          marginLeft: "clamp(-20px, -2.5vw, -30px)",
          transform: `scaleX(-1) translate(${svgOffsetRight.x ?? 0}px, ${svgOffsetRight.y ?? 0}px)`,
        }}
      >
        <AnimatedSvg
          paths={svgPathsRight ?? svgPaths}
          size={svgSizeRight}
          strokeWidth={0.8}
          scrollProgress={svgProgress}
          rotate={svgRotateRight}
        />
      </div>
    </motion.div>
  );
}
