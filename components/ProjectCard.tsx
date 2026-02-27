"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useInView,
  animate,
  AnimatePresence,
} from "framer-motion";
import AnimatedSvg from "./AnimatedSvg";
import {
  glassStyle,
  VaporCloud,
  useInfoBubble,
  useIsMobile,
  useIsDark,
  glassBubbleClassNames,
} from "./InfoBubble";
import { glassClassNames, FuzzyText } from "./LeftInfoBox";

// ─── Provider (pass-through wrapper for page layout) ───

export function ProjectCardProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ─── Types ───

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface SvgConfig {
  paths: string[];
  size?: number;
  rotate?: number;
  offset?: { x?: number; y?: number };
  corner: Corner;
  drawDuration?: number;
}

interface DeploymentInfo {
  githubUrl?: string;
  siteUrl?: string;
  progress: number; // 0–100
}

interface ProjectCardProps {
  title: string;
  techStack: string;
  description: string;
  motivation: string;
  deployment: DeploymentInfo;
  svgs?: SvgConfig[];
  bubbleSide?: "left" | "right";
}

// ─── Iridescent progress bar gradient (matches site palette) ───

const progressGradientLight = `linear-gradient(90deg, rgb(100,115,145), rgb(125,110,135), rgb(105,130,150), rgb(130,115,130), rgb(100,125,145))`;
const progressGradientDark = `linear-gradient(90deg, rgb(180,200,255), rgb(210,185,230), rgb(180,210,235), rgb(215,190,215), rgb(180,200,255))`;

// ─── SVG corner positioning helper ───

function cornerPosition(corner: Corner, offset?: { x?: number; y?: number }) {
  const ox = offset?.x ?? 0;
  const oy = offset?.y ?? 0;
  const isTop = corner.startsWith("top");
  const isRight = corner.endsWith("right");

  return {
    style: {
      ...(isTop ? { top: `${10 + oy}px` } : { bottom: `${10 + oy}px` }),
      ...(isRight ? { right: `${-20 + ox}px` } : { left: `${-20 + ox}px` }),
      transformOrigin: `${isTop ? "top" : "bottom"} ${isRight ? "right" : "left"}`,
    },
  };
}

// ─── Shared bubble shell ───

function BubbleShell({
  side,
  isMobile,
  onPop,
  popRequested,
  parentInView,
  desktopYOffset,
  mobileYOffset,
  children,
}: {
  side: "left" | "right";
  isMobile: boolean;
  onPop: (x: number, y: number, w: number, h: number) => void;
  popRequested?: boolean;
  parentInView?: boolean;
  desktopYOffset?: number;
  mobileYOffset?: number;
  children: React.ReactNode;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(bubbleRef, { once: false, amount: 0.4 });
  const [isPopping, setIsPopping] = useState(false);
  const isRight = side === "right";
  const [isPressed, setIsPressed] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleClick = useCallback(() => {
    if (isPopping) return;
    setIsPopping(true);
    if (!bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    onPop(rect.left + rect.width / 2, rect.top + rect.height / 2, rect.width, rect.height);
  }, [isPopping, onPop]);

  useEffect(() => {
    if (popRequested) handleClick();
  }, [popRequested, handleClick]);

  const dYOff = desktopYOffset ?? 0;
  const mYOff = mobileYOffset ?? 0;

  return (
    <motion.div
      ref={bubbleRef}
      style={{
        position: "absolute",
        top: isMobile ? "100%" : "50%",
        ...(isMobile ? { left: "50%" } : isRight ? { right: 0 } : { left: 0 }),
        width: isMobile ? "min(240px, 85vw)" : 240,
        padding: "16px 20px",
        borderRadius: "24px",
        cursor: "pointer",
        pointerEvents: "auto",
        transformOrigin: isMobile ? "center top" : isRight ? "left center" : "right center",
        zIndex: 9999999,
        ...glassStyle,
      }}
      className={glassBubbleClassNames}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={handleClick}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={(e) => {
        setIsPressed(true);
        const t = e.touches[0];
        touchStartRef.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        setIsPressed(false);
        if (!touchStartRef.current) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartRef.current.x;
        const dy = t.clientY - touchStartRef.current.y;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) handleClick();
        touchStartRef.current = null;
      }}
      initial={
        isMobile
          ? { x: "-50%", y: "0%", scaleX: 0.5, scaleY: 0.15, opacity: 0 }
          : { y: "-50%", x: isRight ? "30%" : "-30%", scaleX: 0.15, scaleY: 0.3, opacity: 0 }
      }
      animate={
        isMobile
          ? {
              x: "-50%",
              y: `${16 + mYOff}px`,
              scaleX: isPopping || isPressed ? 1.08 : 1,
              scaleY: isPopping || isPressed ? 1.08 : 1,
              opacity: isInView || parentInView ? 1 : 0,
            }
          : {
              y: `calc(-50% + ${dYOff}px)`,
              x: isRight ? "calc(100% + 80px)" : "calc(-100% - 80px)",
              scaleX: isPopping || isPressed ? 1.08 : 1,
              scaleY: isPopping || isPressed ? 1.08 : 1,
              opacity: isInView || parentInView ? 1 : 0,
            }
      }
      transition={
        isPopping
          ? { scale: { duration: 0.08, ease: "easeOut" }, opacity: { duration: 0.08 } }
          : { duration: 0.75, ease: [0.34, 1.56, 0.64, 1], opacity: { duration: isInView ? 0.3 : 1.4, ease: "easeInOut" } }
      }
      exit={{ opacity: 0, transition: { duration: 0.001 } }}
      whileHover={isPopping ? {} : { scale: 1.03, transition: { duration: 0.2 } }}
    >
      {/* Glass layers */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.02) 30%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200,220,255,0.05) 0%, transparent 50%)" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", zIndex: 0, WebkitMaskImage: "radial-gradient(ellipse at center, transparent 55%, black 100%)", maskImage: "radial-gradient(ellipse at center, transparent 55%, black 100%)", backdropFilter: "blur(3px) saturate(1.1)", WebkitBackdropFilter: "blur(3px) saturate(1.1)" }} />
      <div className="dark:hidden" style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: "1px", borderRadius: "inherit", pointerEvents: "none", background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 70%, transparent)" }} />
      <div className="hidden dark:block" style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: "1px", borderRadius: "inherit", pointerEvents: "none", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 70%, transparent)" }} />
      <div style={{ position: "absolute", inset: -1, borderRadius: "inherit", pointerEvents: "none", boxShadow: "inset 2px 0 8px rgba(255,0,80,0.04), inset -2px 0 8px rgba(0,100,255,0.04), inset 0 2px 8px rgba(255,200,0,0.03), inset 0 -2px 8px rgba(0,200,255,0.03)" }} />

      {children}
    </motion.div>
  );
}

// ─── Motivation Bubble Content ───

function MotivationBubbleContent({
  motivation,
  isMobile,
}: {
  motivation: string;
  isMobile: boolean;
}) {
  return (
    <div style={{ position: "relative", zIndex: 1, pointerEvents: "none", textAlign: "center" }}>
      <FuzzyText style={{ margin: 0 }}>
        <span className="text-black/50 dark:text-white/50" style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Motivation
        </span>
      </FuzzyText>
      <div className="bg-black/[0.12] dark:bg-white/[0.15]" style={{ height: 1, margin: "8px 0" }} />
      <FuzzyText style={{ margin: 0 }}>
        <span className="text-black/80 dark:text-white/80" style={{ fontSize: 10, lineHeight: 1.5 }}>
          {motivation}
        </span>
      </FuzzyText>
      <p style={{ margin: "10px 0 0", fontSize: 10, opacity: 0.4 }} className="text-black dark:text-white">
        {isMobile ? "tap to dismiss" : "click to dismiss"}
      </p>
    </div>
  );
}

// ─── Deployment Bubble Content ───

function DeploymentBubbleContent({
  deployment,
  isMobile,
  isDark,
}: {
  deployment: DeploymentInfo;
  isMobile: boolean;
  isDark: boolean;
}) {
  const LinkOrPlaceholder = ({ url, label }: { url?: string; label: string }) => {
    if (url) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ pointerEvents: "auto" }}
          className="text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white transition-colors duration-200"
        >
          <span style={{ fontSize: 10, fontFamily: "monospace", textDecoration: "underline", textUnderlineOffset: 3 }}>
            {label}
          </span>
        </a>
      );
    }
    return (
      <span className="flex items-center gap-2">
        <span className="text-black/30 dark:text-white/30" style={{ fontSize: 10, fontFamily: "monospace" }}>
          {label}
        </span>
        <span className="bg-black/20 dark:bg-white/20" style={{ width: 24, height: 1, display: "inline-block", borderRadius: 1 }} />
      </span>
    );
  };

  return (
    <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
      <FuzzyText style={{ margin: 0 }}>
        <span className="text-black/50 dark:text-white/50" style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Deployment
        </span>
      </FuzzyText>
      <div className="bg-black/[0.12] dark:bg-white/[0.15]" style={{ height: 1, margin: "8px 0" }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, pointerEvents: "auto" }}>
        <LinkOrPlaceholder url={deployment.githubUrl} label="GitHub" />
        <LinkOrPlaceholder url={deployment.siteUrl} label="Live Site" />
      </div>

      <div className="bg-black/[0.12] dark:bg-white/[0.15]" style={{ height: 1, margin: "10px 0" }} />

      <FuzzyText style={{ margin: 0 }}>
        <span className="text-black/50 dark:text-white/50" style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Progress
        </span>
      </FuzzyText>
      <div style={{ marginTop: 6 }}>
        <div
          className="bg-black/[0.06] dark:bg-white/[0.06]"
          style={{ width: "100%", height: 6, borderRadius: 3, overflow: "hidden", position: "relative" }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${deployment.progress}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            style={{
              height: "100%",
              borderRadius: 3,
              backgroundImage: isDark ? progressGradientDark : progressGradientLight,
              backgroundSize: "200% 100%",
              animation: "iridescentShift 3s linear infinite",
            }}
          />
        </div>
        <FuzzyText style={{ margin: 0 }}>
          <span className="text-black/60 dark:text-white/60" style={{ fontSize: 9, marginTop: 4, display: "inline-block" }}>
            {deployment.progress}%
          </span>
        </FuzzyText>
      </div>

      <p style={{ margin: "8px 0 0", fontSize: 10, opacity: 0.4, pointerEvents: "none" }} className="text-black dark:text-white">
        {isMobile ? "tap to dismiss" : "click to dismiss"}
      </p>
    </div>
  );
}

// ─── Project Card ───

const BUBBLE_STACK_OFFSET = 120; // px the second bubble shifts when both open
const MOBILE_BUBBLE_STACK = 280; // px the second bubble shifts on mobile

export default function ProjectCard({
  title,
  techStack,
  description,
  motivation,
  deployment,
  svgs = [],
  bubbleSide = "right",
}: ProjectCardProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isDark = useIsDark();
  const isInView = useInView(boxRef, { once: false, amount: isMobile ? 0.15 : 0.1 });

  const motivationBubble = useInfoBubble();
  const deploymentBubble = useInfoBubble();

  // Track which bubble opened first so the second one pushes the first down
  const firstOpenedRef = useRef<"motivation" | "deployment" | null>(null);

  // Update tracking when bubbles open/close
  useEffect(() => {
    const motOpen = motivationBubble.isBubbleOpen;
    const depOpen = deploymentBubble.isBubbleOpen;

    if (!motOpen && !depOpen) {
      firstOpenedRef.current = null;
    } else if (motOpen && !depOpen) {
      firstOpenedRef.current = "motivation";
    } else if (depOpen && !motOpen) {
      firstOpenedRef.current = "deployment";
    }
  }, [motivationBubble.isBubbleOpen, deploymentBubble.isBubbleOpen]);

  const anyBubbleOpen = motivationBubble.isBubbleOpen || deploymentBubble.isBubbleOpen;
  const bothBubblesOpen = motivationBubble.isBubbleOpen && deploymentBubble.isBubbleOpen;
  const shouldShow = isMobile ? isInView : isInView || anyBubbleOpen;

  // When both are open, the first-opened gets pushed down, the newer one sits on top
  const motivationIsFirst = firstOpenedRef.current === "motivation";

  // Desktop: first-opened shifts down, second stays up
  const motivationDesktopY = bothBubblesOpen
    ? (motivationIsFirst ? BUBBLE_STACK_OFFSET : -BUBBLE_STACK_OFFSET)
    : 0;
  const deploymentDesktopY = bothBubblesOpen
    ? (motivationIsFirst ? -BUBBLE_STACK_OFFSET : BUBBLE_STACK_OFFSET)
    : 0;

  // Mobile: the most recent bubble sits on top (closer to card),
  // pushing the first-opened one further down.
  const motivationMobileY = bothBubblesOpen && motivationIsFirst ? MOBILE_BUBBLE_STACK : 0;
  const deploymentMobileY = bothBubblesOpen && !motivationIsFirst ? MOBILE_BUBBLE_STACK : 0;

  // Only spread cards apart when both bubbles are open — that's when
  // the stacked pair actually extends beyond the card bounds.
  const desktopMarginY = bothBubblesOpen ? 60 : 0;

  // SVG draw progress
  const svgProgress = useMotionValue(0);
  const drawTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onViewportEnter = useCallback(() => {
    if (drawTimer.current) clearTimeout(drawTimer.current);
    drawTimer.current = setTimeout(() => {
      animate(svgProgress, 1, { duration: 3, ease: "easeInOut" });
      drawTimer.current = null;
    }, 600);
  }, [svgProgress]);

  const onViewportLeave = useCallback(() => {
    if (drawTimer.current) clearTimeout(drawTimer.current);
    drawTimer.current = null;
    animate(svgProgress, 0, { duration: 1.8, ease: "easeInOut" });
  }, [svgProgress]);

  return (
    <>
      {/* Vapor clouds */}
      {motivationBubble.vaporOrigin && (
        <VaporCloud
          originX={motivationBubble.vaporOrigin.x}
          originY={motivationBubble.vaporOrigin.y}
          bubbleWidth={motivationBubble.vaporOrigin.w}
          bubbleHeight={motivationBubble.vaporOrigin.h}
          onComplete={motivationBubble.handleVaporDone}
        />
      )}
      {deploymentBubble.vaporOrigin && (
        <VaporCloud
          originX={deploymentBubble.vaporOrigin.x}
          originY={deploymentBubble.vaporOrigin.y}
          bubbleWidth={deploymentBubble.vaporOrigin.w}
          bubbleHeight={deploymentBubble.vaporOrigin.h}
          onComplete={deploymentBubble.handleVaporDone}
        />
      )}

      <motion.div
        ref={boxRef}
        initial={{ x: 0, y: 15, marginTop: 0, marginBottom: 0 }}
        animate={
          shouldShow
            ? { x: 0, y: 0, marginTop: isMobile ? 0 : desktopMarginY, marginBottom: isMobile ? 0 : desktopMarginY }
            : { x: 0, y: 15, marginTop: 0, marginBottom: 0 }
        }
        onViewportEnter={onViewportEnter}
        onViewportLeave={onViewportLeave}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        style={{
          position: "relative",
          zIndex: anyBubbleOpen ? 10 : "auto",
          display: "flex",
          flexDirection: "column",
        }}
        className="w-[calc(100%-2rem)] mx-auto md:mx-0 md:w-[420px] lg:w-[460px] min-h-[280px] md:min-h-[320px]"
      >
        {/* SVGs positioned at specified corners */}
        {svgs.map((svg, i) => {
          const pos = cornerPosition(svg.corner, svg.offset);
          return (
            <motion.div
              key={i}
              className="hidden md:block"
              initial={{ opacity: 0 }}
              animate={shouldShow ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              style={{
                position: "absolute",
                ...pos.style,
                pointerEvents: "none",
                zIndex: 0,
              }}
            >
              <AnimatedSvg
                paths={svg.paths}
                size={svg.size ?? 60}
                strokeWidth={0.8}
                scrollProgress={svgProgress}
                rotate={svg.rotate ?? 0}
              />
            </motion.div>
          );
        })}

        {/* Glass box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={shouldShow ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          style={{ position: "relative", borderRadius: "24px", flex: 1, ...glassStyle }}
          className={`${glassClassNames} p-5 md:p-8`}
        >
          {/* Specular highlights */}
          <div className="dark:hidden" style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 70%, transparent)", borderRadius: "inherit", pointerEvents: "none", zIndex: 1 }} />
          <div className="hidden dark:block" style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 70%, transparent)", borderRadius: "inherit", pointerEvents: "none", zIndex: 1 }} />
          <div className="dark:hidden" style={{ position: "absolute", bottom: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.04) 70%, transparent)", borderRadius: "inherit", pointerEvents: "none", zIndex: 1 }} />
          <div className="hidden dark:block" style={{ position: "absolute", bottom: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.2) 70%, transparent)", borderRadius: "inherit", pointerEvents: "none", zIndex: 1 }} />
          <div style={{ position: "absolute", top: -1, left: -1, right: -1, bottom: -1, borderRadius: "inherit", pointerEvents: "none", zIndex: 0, boxShadow: "inset 2px 0 8px rgba(255,0,80,0.04), inset -2px 0 8px rgba(0,100,255,0.04), inset 0 2px 8px rgba(255,200,0,0.03), inset 0 -2px 8px rgba(0,200,255,0.03)" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.02) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200,220,255,0.05) 0%, transparent 50%)" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", zIndex: 0, WebkitMaskImage: "radial-gradient(ellipse at center, transparent 55%, black 100%)", maskImage: "radial-gradient(ellipse at center, transparent 55%, black 100%)", backdropFilter: "blur(3px) saturate(1.1)", WebkitBackdropFilter: "blur(3px) saturate(1.1)" }} />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Title */}
            <h2 style={{ marginTop: 0, marginBottom: "4px", fontSize: "clamp(1.25rem, 2vw, 1.625rem)", fontWeight: 700, textAlign: "center" }}>
              <FuzzyText>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: isDark
                      ? "linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)"
                      : "linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)",
                  }}
                >
                  {title}
                </span>
              </FuzzyText>
            </h2>

            {/* Tech Stack */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginBottom: 12 }}>
              {techStack.split(",").map((tech) => (
                <span
                  key={tech.trim()}
                  className="text-black/70 dark:text-white/70 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08]"
                  style={{ fontSize: 9, fontFamily: "monospace", padding: "2px 6px", borderRadius: 6, letterSpacing: "0.02em" }}
                >
                  {tech.trim()}
                </span>
              ))}
            </div>

            {/* Description */}
            <p
              className="font-[family-name:var(--font-elevated)]"
              style={{ marginTop: 0, marginBottom: 0, fontSize: "clamp(0.8rem, 1.1vw, 1rem)", fontWeight: 700, letterSpacing: "-0.005em" }}
            >
              <FuzzyText>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: isDark
                      ? "linear-gradient(135deg, rgba(248,250,255,0.96) 0%, rgba(255,248,255,0.93) 15%, rgba(248,252,255,0.95) 30%, rgba(255,250,255,0.92) 45%, rgba(245,250,255,0.94) 60%, rgba(255,248,255,0.93) 75%, rgba(248,250,255,0.95) 90%, rgba(255,248,255,0.93) 100%)"
                      : "linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(25,15,35,0.92) 15%, rgba(10,20,30,0.94) 30%, rgba(30,15,25,0.9) 45%, rgba(10,20,28,0.93) 60%, rgba(22,12,32,0.91) 75%, rgba(12,18,30,0.94) 90%, rgba(28,15,28,0.91) 100%)",
                  }}
                >
                  {description}
                </span>
              </FuzzyText>
            </p>

            {/* Bubble toggle buttons */}
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={motivationBubble.isBubbleOpen ? motivationBubble.requestPop : motivationBubble.openBubble}
                className="group relative px-3 py-1.5 rounded-full text-xs font-medium text-black dark:text-white bg-blue-500/3 hover:bg-blue-500/5 dark:bg-white/5 dark:hover:bg-white/10 border border-[rgba(100,130,200,0.2)] dark:border-[rgba(255,255,255,0.05)] transition-all duration-300"
              >
                <span className="relative z-10">
                  {motivationBubble.isBubbleOpen ? "Close" : "Reasoning"}
                </span>
              </button>
              <button
                onClick={deploymentBubble.isBubbleOpen ? deploymentBubble.requestPop : deploymentBubble.openBubble}
                className="group relative px-3 py-1.5 rounded-full text-xs font-medium text-black dark:text-white bg-blue-500/3 hover:bg-blue-500/5 dark:bg-white/5 dark:hover:bg-white/10 border border-[rgba(100,130,200,0.2)] dark:border-[rgba(255,255,255,0.05)] transition-all duration-300"
              >
                <span className="relative z-10">
                  {deploymentBubble.isBubbleOpen ? "Close" : "Deploy Info"}
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Both bubbles on the same side */}
        <motion.div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999999, pointerEvents: "none", overflow: "visible" }}>
          <AnimatePresence>
            {motivationBubble.isBubbleOpen && (
              <BubbleShell
                key="motivation"
                side={bubbleSide}
                isMobile={isMobile}
                onPop={motivationBubble.handlePop}
                popRequested={motivationBubble.popRequested}
                parentInView={isInView}
                desktopYOffset={motivationDesktopY}
                mobileYOffset={motivationMobileY}
              >
                <MotivationBubbleContent motivation={motivation} isMobile={isMobile} />
              </BubbleShell>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {deploymentBubble.isBubbleOpen && (
              <BubbleShell
                key="deployment"
                side={bubbleSide}
                isMobile={isMobile}
                onPop={deploymentBubble.handlePop}
                popRequested={deploymentBubble.popRequested}
                parentInView={isInView}
                desktopYOffset={deploymentDesktopY}
                mobileYOffset={deploymentMobileY}
              >
                <DeploymentBubbleContent deployment={deployment} isMobile={isMobile} isDark={isDark} />
              </BubbleShell>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Mobile spacer */}
      {isMobile && (
        <motion.div
          animate={{ height: bothBubblesOpen ? 600 : anyBubbleOpen ? 300 : 0 }}
          transition={
            anyBubbleOpen
              ? { duration: 0.6, ease: [0.25, 1, 0.5, 1] }
              : { duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }
          }
          style={{ height: 0, overflow: "hidden" }}
        />
      )}
    </>
  );
}
