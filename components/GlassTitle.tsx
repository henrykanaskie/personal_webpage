"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { motion, useInView, useMotionValue, animate } from "framer-motion";
import AnimatedSvg from "./AnimatedSvg";
import { useIsDark } from "../lib/glass";
import { cs, themed } from "../lib/tokens";
import { registerShineEffect } from "../lib/scrollVelocity";

type GlassTitleVariant = "iridescent" | "crystalline" | "crystalline-blur";

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
  variant = "crystalline",
  debugVariantToggle = false,
  fontSize,
  containerClassName,
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
  variant?: GlassTitleVariant;
  debugVariantToggle?: boolean;
  fontSize?: string;
  containerClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const textMeasureRef = useRef<HTMLSpanElement>(null);
  const shineRef = useRef<HTMLSpanElement>(null);
  const causticRef = useRef<HTMLSpanElement>(null);
  const isDark = useIsDark();
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const svgProgress = useMotionValue(0);
  const drawTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const variants = useMemo(
    () => ["crystalline", "crystalline-blur", "iridescent"] as const,
    [],
  );
  const [debugVariant, setDebugVariant] = useState<GlassTitleVariant>(variant);
  const effectiveVariant =
    debugVariantToggle && process.env.NODE_ENV !== "production"
      ? debugVariant
      : variant;

  const isCrystalline = effectiveVariant === "crystalline";
  const isCrystallineBlur = effectiveVariant === "crystalline-blur";

  const titleStyles: React.CSSProperties = useMemo(() => {
    if (effectiveVariant === "iridescent") {
      return {
        WebkitBackgroundClip: "text",
        backgroundImage: themed(
          isDark,
          cs.iridescent.dark,
          cs.iridescent.light,
        ),
        textShadow: themed(isDark, cs.titleShadow.dark, cs.titleShadow.light),
      };
    }

    // Crystalline base: clearer fill + crisp edge.
    return {
      WebkitBackgroundClip: "text",
      backgroundImage: themed(
        isDark,
        "linear-gradient(180deg, rgba(255,255,255,0.52) 0%, rgba(225,238,255,0.26) 52%, rgba(255,255,255,0.18) 100%)",
        "linear-gradient(180deg, rgba(16,22,34,0.52) 0%, rgba(18,26,40,0.30) 52%, rgba(12,18,28,0.18) 100%)",
      ),
      WebkitTextStroke: themed(
        isDark,
        "1.05px rgba(255,255,255,0.30)",
        "1.05px rgba(255,255,255,0.46)",
      ),
      textShadow: themed(
        isDark,
        "0 1px 0 rgba(255,255,255,0.10), 0 10px 38px rgba(0,0,0,0.55), 0 42px 160px rgba(0,0,0,0.90)",
        "0 1px 0 rgba(255,255,255,0.28), 0 10px 34px rgba(0,0,0,0.14), 0 42px 140px rgba(0,0,0,0.16)",
      ),
      filter: themed(
        isDark,
        isCrystallineBlur
          ? "contrast(1.18) saturate(1.05)"
          : "contrast(1.14) saturate(1.02)",
        isCrystallineBlur
          ? "contrast(1.10) saturate(0.98)"
          : "contrast(1.06) saturate(0.96)",
      ),
    };
  }, [effectiveVariant, isDark, isCrystallineBlur]);

  const crystalRefractionStyles: React.CSSProperties = useMemo(() => {
    if (!isCrystalline && !isCrystallineBlur) return {};
    return {
      WebkitBackgroundClip: "text",
      // Clearer internal refraction; less bloom, more "cut" light.
      backgroundImage: themed(
        isDark,
        "radial-gradient(140% 90% at 12% 14%, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.16) 30%, rgba(255,255,255,0.05) 46%, transparent 62%), radial-gradient(120% 95% at 92% 88%, rgba(140,190,255,0.26) 0%, rgba(140,190,255,0.10) 34%, rgba(140,190,255,0.03) 54%, transparent 70%), linear-gradient(118deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.14) 24%, rgba(160,205,255,0.06) 40%, rgba(255,255,255,0.08) 54%, rgba(125,180,255,0.12) 70%, rgba(255,255,255,0.00) 100%)",
        "radial-gradient(140% 90% at 12% 14%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.04) 46%, transparent 62%), radial-gradient(120% 95% at 92% 88%, rgba(105,155,230,0.18) 0%, rgba(105,155,230,0.08) 34%, rgba(105,155,230,0.02) 54%, transparent 70%), linear-gradient(118deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.10) 24%, rgba(140,185,255,0.04) 40%, rgba(255,255,255,0.05) 54%, rgba(90,140,215,0.08) 70%, rgba(255,255,255,0.00) 100%)",
      ),
      filter: themed(
        isDark,
        isCrystallineBlur ? "contrast(1.18)" : "contrast(1.16)",
        isCrystallineBlur ? "contrast(1.12)" : "contrast(1.10)",
      ),
      opacity: themed(isDark, 0.88, 0.78) as unknown as number,
    };
  }, [isCrystalline, isCrystallineBlur, isDark]);

  const crystalRimStyles: React.CSSProperties = useMemo(() => {
    if (!isCrystalline && !isCrystallineBlur) return {};
    return {
      WebkitBackgroundClip: "text",
      // Edge-focused specular: bright top rim + cool bottom rim.
      backgroundImage: themed(
        isDark,
        "linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.18) 38%, rgba(180,220,255,0.12) 62%, rgba(140,190,255,0.22) 100%)",
        "linear-gradient(180deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.12) 38%, rgba(160,205,255,0.08) 62%, rgba(105,155,230,0.14) 100%)",
      ),
      filter: themed(
        isDark,
        isCrystallineBlur ? "contrast(1.20)" : "contrast(1.18)",
        isCrystallineBlur ? "contrast(1.14)" : "contrast(1.12)",
      ),
      opacity: themed(isDark, 0.78, 0.48) as unknown as number,
      mixBlendMode: themed(
        isDark,
        "screen",
        "overlay",
      ) as unknown as React.CSSProperties["mixBlendMode"],
    };
  }, [isCrystalline, isCrystallineBlur, isDark]);

  const crystalCausticStyles: React.CSSProperties = useMemo(() => {
    if (!isCrystalline && !isCrystallineBlur) return {};
    return {
      WebkitBackgroundClip: "text",
      // Tighter caustics: localized "spark" rather than a wide sweep.
      backgroundImage: themed(
        isDark,
        "linear-gradient(103deg, transparent 0%, transparent 44%, rgba(255,255,255,0.18) 48%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0.16) 52%, transparent 56%, transparent 100%)",
        "linear-gradient(103deg, transparent 0%, transparent 44%, rgba(255,255,255,0.12) 48%, rgba(255,255,255,0.24) 50%, rgba(255,255,255,0.10) 52%, transparent 56%, transparent 100%)",
      ),
      backgroundSize: "320% 120%",
      backgroundPosition: "var(--glass-shine-x, 200%) center",
      opacity: "var(--glass-caustic-o, 0)",
      filter: undefined,
      mixBlendMode: themed(
        isDark,
        "screen",
        "multiply",
      ) as unknown as React.CSSProperties["mixBlendMode"],
    };
  }, [isCrystalline, isCrystallineBlur, isDark]);

  const dispersionBase: React.CSSProperties = useMemo(() => {
    if (!isCrystalline && !isCrystallineBlur) return {};
    // Optical dispersion (tiny): sub-pixel offsets with very low opacity.
    return {
      WebkitBackgroundClip: "text",
      opacity: themed(isDark, 0.22, 0.12) as unknown as number,
      filter: undefined,
      mixBlendMode: themed(
        isDark,
        "screen",
        "overlay",
      ) as unknown as React.CSSProperties["mixBlendMode"],
      willChange: "transform, opacity",
      transform: "translateZ(0)",
    };
  }, [isCrystalline, isCrystallineBlur, isDark]);

  useEffect(() => {
    setDebugVariant(variant);
  }, [variant]);

  useEffect(() => {
    if (!debugVariantToggle || process.env.NODE_ENV === "production") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key !== "[" &&
        e.key !== "]" &&
        e.key !== "ArrowLeft" &&
        e.key !== "ArrowRight"
      )
        return;
      const dir = e.key === "]" || e.key === "ArrowRight" ? 1 : -1;
      e.preventDefault();
      setDebugVariant((cur) => {
        const i = variants.indexOf(cur as (typeof variants)[number]);
        const next = variants[(i + dir + variants.length) % variants.length];
        return (next ?? cur) as GlassTitleVariant;
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [debugVariantToggle, variants]);

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

  useEffect(() => {
    const shineEl = shineRef.current;
    const causticEl = causticRef.current;
    if (!shineEl && !causticEl) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    return registerShineEffect(shineEl, causticEl);
  }, []);

  const leftPaths = svgPathsLeft ?? svgPaths;
  const rightPaths = svgPathsRight ?? svgPaths;
  const showLeft = leftPaths.length > 0;
  const showRight = rightPaths.length > 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      style={{ willChange: "transform, opacity" }}
      className={`flex justify-center items-center pt-12 md:pt-18 pb-4 md:pb-8 select-none ${containerClassName ?? ""}`}
    >
      {/* Left SVG — overlaps into text with negative margin */}
      {showLeft && (
        <div
          className="pointer-events-none hidden md:flex items-center shrink-0"
          style={{
            marginRight: "clamp(-20px, -2.5vw, -30px)",
            transform: `translate(${svgOffsetLeft.x ?? 0}px, ${svgOffsetLeft.y ?? 0}px)`,
          }}
        >
          <AnimatedSvg
            paths={leftPaths}
            size={svgSizeLeft}
            strokeWidth={0.8}
            scrollProgress={svgProgress}
            rotate={svgRotateLeft}
          />
        </div>
      )}

      <span
        className="relative font-[family-name:var(--font-elevated)] font-extrabold tracking-tight leading-none"
        style={{
          fontSize: fontSize ?? "clamp(4rem, 11vw, 10rem)",
          letterSpacing: "-0.02em",
          zIndex: 1,
          whiteSpace: "pre-line",
          display: "inline-block",
        }}
      >
        {/* Title text */}
        <span
          ref={textMeasureRef}
          className="relative bg-clip-text text-transparent"
          style={titleStyles}
        >
          {text}
        </span>

        {/* Crystalline layers */}
        {(isCrystalline || isCrystallineBlur) && (
          <>
            {/* Refraction */}
            <span
              aria-hidden
              className="absolute inset-0 -bottom-[0.15em] bg-clip-text text-transparent pointer-events-none"
              style={crystalRefractionStyles}
            >
              {text}
            </span>

            {/* Rim/specular */}
            <span
              aria-hidden
              className="absolute inset-0 -bottom-[0.15em] bg-clip-text text-transparent pointer-events-none"
              style={crystalRimStyles}
            >
              {text}
            </span>

            {/* Dispersion (tiny chromatic split) */}
            <span
              aria-hidden
              className="absolute inset-0 -bottom-[0.15em] bg-clip-text text-transparent pointer-events-none"
              style={{
                ...dispersionBase,
                backgroundImage:
                  "linear-gradient(90deg, rgba(255,90,120,0.55), rgba(255,90,120,0.00) 60%)",
                transform: "translateX(-0.35px) translateZ(0)",
              }}
            >
              {text}
            </span>
            <span
              aria-hidden
              className="absolute inset-0 -bottom-[0.15em] bg-clip-text text-transparent pointer-events-none"
              style={{
                ...dispersionBase,
                backgroundImage:
                  "linear-gradient(90deg, rgba(120,190,255,0.00) 40%, rgba(120,190,255,0.55))",
                transform: "translateX(0.35px) translateZ(0)",
              }}
            >
              {text}
            </span>

            {/* Caustic spark */}
            <span
              aria-hidden
              className="absolute inset-0 -bottom-[0.15em] bg-clip-text text-transparent pointer-events-none"
              ref={causticRef}
              style={crystalCausticStyles}
            >
              {text}
            </span>
          </>
        )}

        {/* Shine — driven by scroll direction/speed */}
        <span
          ref={shineRef}
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
            backgroundPosition: "var(--glass-shine-x, 200%) center",
            opacity: "var(--glass-shine-o, 0)",
          }}
        >
          {text}
        </span>

        {/* Dev-only variant toggle */}
        {debugVariantToggle && process.env.NODE_ENV !== "production" && (
          <div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] tracking-wide text-white/80 backdrop-blur-md"
            style={{
              boxShadow:
                "0 10px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <button
              type="button"
              className="rounded-full px-2 py-0.5 text-white/80 hover:text-white"
              onClick={() =>
                setDebugVariant((cur) => {
                  const i = variants.indexOf(cur as (typeof variants)[number]);
                  const next =
                    variants[(i - 1 + variants.length) % variants.length];
                  return (next ?? cur) as GlassTitleVariant;
                })
              }
            >
              Prev
            </button>
            <span className="text-white/60">|</span>
            <span className="min-w-[140px] text-center font-medium text-white/85">
              {effectiveVariant}
            </span>
            <span className="text-white/60">|</span>
            <button
              type="button"
              className="rounded-full px-2 py-0.5 text-white/80 hover:text-white"
              onClick={() =>
                setDebugVariant((cur) => {
                  const i = variants.indexOf(cur as (typeof variants)[number]);
                  const next = variants[(i + 1) % variants.length];
                  return (next ?? cur) as GlassTitleVariant;
                })
              }
            >
              Next
            </button>
            <span className="hidden md:inline text-white/50">[ / ] or ← →</span>
          </div>
        )}
      </span>

      {/* Right SVG — overlaps into text with negative margin, mirrored */}
      {showRight && (
        <div
          className="pointer-events-none hidden md:flex items-center shrink-0"
          style={{
            marginLeft: "clamp(-20px, -2.5vw, -30px)",
            transform: `scaleX(-1) translate(${svgOffsetRight.x ?? 0}px, ${svgOffsetRight.y ?? 0}px)`,
          }}
        >
          <AnimatedSvg
            paths={rightPaths}
            size={svgSizeRight}
            strokeWidth={0.8}
            scrollProgress={svgProgress}
            rotate={svgRotateRight}
          />
        </div>
      )}
    </motion.div>
  );
}
