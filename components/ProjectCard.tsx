"use client";

import { useRef, useCallback, useState, useEffect, RefObject, memo } from "react";
import {
  motion,
  useMotionValue,
  useInView,
  useIsPresent,
  animate,
  AnimatePresence,
} from "framer-motion";
import AnimatedSvg from "./AnimatedSvg";
import {
  VaporCloud,
  useInfoBubble,
} from "./InfoBubble";
import { glassStyle, GlassLayers, FuzzyText, useIsMobile, useIsDark } from "../lib/glass";
import { glassBubbleClassNames, glassBoxClassNames, cs, themed } from "../lib/tokens";

// ─── useInView with hysteresis (different enter/leave thresholds) ───

function useInViewHysteresis(
  ref: RefObject<Element | null>,
  { enterAmount, leaveAmount }: { enterAmount: number; leaveAmount: number }
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only need thresholds at the actual comparison points (leaveAmount=0.08, enterAmount=0.35/0.40)
    const thresholds = [0, 0.08, 0.35, 0.40];
    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        if (ratio >= enterAmount) setInView(true);
        else if (ratio < leaveAmount) setInView(false);
      },
      { threshold: thresholds }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, enterAmount, leaveAmount]);

  return inView;
}

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
  thumbnail?: string;
  deployment: DeploymentInfo;
  svgs?: SvgConfig[];
  bubbleSide?: "left" | "right";
}

// ─── Iridescent progress bar gradient (matches site palette) ───

const progressGradientLight = cs.progressBar.light;
const progressGradientDark = cs.progressBar.dark;

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

const BubbleShell = memo(function BubbleShell({
  side,
  isMobile,
  onPop,
  popRequested,
  parentInView,
  desktopYOffset,
  desktopX,
  mobileYOffset,
  children,
}: {
  side: "left" | "right";
  isMobile: boolean | null;
  onPop: (x: number, y: number, w: number, h: number) => void;
  popRequested?: boolean;
  parentInView?: boolean;
  desktopYOffset?: number;
  desktopX?: number;
  mobileYOffset?: number;
  children: React.ReactNode;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(bubbleRef, { once: false, amount: 0.4 });
  const showBelow = isMobile;
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
        ...(showBelow ? { left: "50%" } : isRight ? { right: 0 } : { left: 0 }),
        width: showBelow ? "min(240px, 85vw)" : 240,
        padding: "16px 20px",
        borderRadius: "24px",
        cursor: "pointer",
        pointerEvents: "auto",
        transformOrigin: showBelow ? "center top" : isRight ? "left center" : "right center",
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
        showBelow
          ? { top: "100%", x: "-50%", y: "0%", scaleX: 0.5, scaleY: 0.15, opacity: 0 }
          : { top: "50%", y: "-50%", x: isRight ? "30%" : "-30%", scaleX: 0.15, scaleY: 0.3, opacity: 0 }
      }
      animate={
        showBelow
          ? {
              top: "100%",
              x: "-50%",
              y: `${16 + mYOff}px`,
              scaleX: isPopping || isPressed ? 1.08 : 1,
              scaleY: isPopping || isPressed ? 1.08 : 1,
              opacity: isInView || parentInView ? 1 : 0,
            }
          : {
              top: "50%",
              y: `calc(-50% + ${dYOff}px)`,
              x: desktopX !== undefined
                ? desktopX
                : (isRight ? "calc(100% + 80px)" : "calc(-100% - 80px)"),
              scaleX: isPopping || isPressed ? 1.08 : 1,
              scaleY: isPopping || isPressed ? 1.08 : 1,
              opacity: isInView || parentInView ? 1 : 0,
            }
      }
      transition={
        isPopping
          ? { scale: { duration: 0.08, ease: "easeOut" }, opacity: { duration: 0.08 } }
          : {
              duration: 0.75,
              ease: [0.34, 1.56, 0.64, 1],
              top: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
              x: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
              opacity: { duration: 0.9, ease: "easeInOut" },
            }
      }
      exit={{ opacity: 0, transition: { duration: 0.001 } }}
      whileHover={isPopping ? {} : { scale: 1.03, transition: { duration: 0.2 } }}
    >
      <GlassLayers refractionSide="left" specularInset="15%" />

      {children}
    </motion.div>
  );
});

// ─── Thumbnail Bubble Content ───

const ThumbnailBubbleContent = memo(function ThumbnailBubbleContent({
  thumbnail,
  isMobile,
  isDark,
}: {
  thumbnail?: string;
  isMobile: boolean | null;
  isDark: boolean;
}) {
  return (
    <div style={{ position: "relative", zIndex: 1, pointerEvents: "none", textAlign: "center" }}>
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          width: "100%",
          aspectRatio: "16 / 9",
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt="Project thumbnail"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <span
            className="text-black/20 dark:text-white/20"
            style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            Preview
          </span>
        )}
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 10, opacity: 0.4 }} className="text-black dark:text-white">
        {isMobile ? "tap to dismiss" : "click to dismiss"}
      </p>
    </div>
  );
});

// ─── Deployment Bubble Content ───

const DeploymentBubbleContent = memo(function DeploymentBubbleContent({
  deployment,
  isMobile,
  isDark,
}: {
  deployment: DeploymentInfo;
  isMobile: boolean | null;
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
});

// ─── Project Card ───

const BUBBLE_STACK_OFFSET = 120; // px the second bubble shifts when both open

export default function ProjectCard({
  title,
  techStack,
  description,
  thumbnail,
  deployment,
  svgs = [],
  bubbleSide = "right",
}: ProjectCardProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile(1650);
  const isDark = useIsDark();
  const isInView = useInViewHysteresis(boxRef, {
    enterAmount: isMobile ? 0.4 : 0.35,
    leaveAmount: 0.08,
  });

  const thumbnailBubble = useInfoBubble();
  const deploymentBubble = useInfoBubble();

  // Auto-open thumbnail bubble when card comes into view
  useEffect(() => {
    if (isInView) thumbnailBubble.openBubble();
  }, [isInView, thumbnailBubble.openBubble]);

  // Track which bubble opened first so the second one pushes the first down
  const firstOpenedRef = useRef<"thumbnail" | "deployment" | null>(null);

  // Update tracking when bubbles open/close
  useEffect(() => {
    const thumbOpen = thumbnailBubble.isBubbleOpen;
    const depOpen = deploymentBubble.isBubbleOpen;

    if (!thumbOpen && !depOpen) {
      firstOpenedRef.current = null;
    } else if (thumbOpen && !depOpen) {
      firstOpenedRef.current = "thumbnail";
    } else if (depOpen && !thumbOpen) {
      firstOpenedRef.current = "deployment";
    }
  }, [thumbnailBubble.isBubbleOpen, deploymentBubble.isBubbleOpen]);

  const anyBubbleOpen = thumbnailBubble.isBubbleOpen || deploymentBubble.isBubbleOpen;
  const bothBubblesOpen = thumbnailBubble.isBubbleOpen && deploymentBubble.isBubbleOpen;
  // When both are open, the first-opened gets pushed down, the newer one sits on top
  const thumbnailIsFirst = firstOpenedRef.current === "thumbnail";

  // Desktop: first-opened shifts down, second stays up
  const thumbnailDesktopY = bothBubblesOpen
    ? (thumbnailIsFirst ? BUBBLE_STACK_OFFSET : -BUBBLE_STACK_OFFSET)
    : 0;
  const deploymentDesktopY = bothBubblesOpen
    ? (thumbnailIsFirst ? -BUBBLE_STACK_OFFSET : BUBBLE_STACK_OFFSET)
    : 0;

  // Mobile: stacked vertically when both open (~280px per bubble)
  const thumbnailMobileYOffset = 0;
  const deploymentMobileYOffset = bothBubblesOpen ? 200 : 0;

  // SVG draw progress
  const svgProgress = useMotionValue(0);
  const drawTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPresent = useIsPresent();

  // Fast undraw when page exit starts
  useEffect(() => {
    if (!isPresent) {
      if (drawTimer.current) clearTimeout(drawTimer.current);
      drawTimer.current = null;
      animate(svgProgress, 0, { duration: 0.35, ease: "easeIn" });
    }
  }, [isPresent, svgProgress]);

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
      {thumbnailBubble.vaporOrigin && (
        <VaporCloud
          originX={thumbnailBubble.vaporOrigin.x}
          originY={thumbnailBubble.vaporOrigin.y}
          bubbleWidth={thumbnailBubble.vaporOrigin.w}
          bubbleHeight={thumbnailBubble.vaporOrigin.h}
          onComplete={thumbnailBubble.handleVaporDone}
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
        initial={{ x: bubbleSide === "left" ? "-100vw" : "100vw" }}
        animate={
          isInView
            ? { x: 0, y: 0 }
            : { x: isMobile ? 0 : (bubbleSide === "left" ? -20 : 20), y: isMobile ? 15 : 10 }
        }
        exit={{
          x: bubbleSide === "left" ? "-100vw" : "100vw",
          transition: { duration: 0.7, ease: [0.5, 0, 0.75, 0] },
        }}
        onViewportEnter={onViewportEnter}
        onViewportLeave={onViewportLeave}
        transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
        style={{
          position: "relative",
          zIndex: anyBubbleOpen ? 10 : "auto",
          display: "flex",
          flexDirection: "column",
          willChange: "transform",
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
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
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
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          style={{ position: "relative", borderRadius: "24px", flex: 1, ...glassStyle }}
          className={`${glassBoxClassNames} p-5 md:p-8`}
        >
          <GlassLayers refractionSide="left" />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Title */}
            <h2 style={{ marginTop: 0, marginBottom: "4px", fontSize: "clamp(1.25rem, 2vw, 1.625rem)", fontWeight: 700, textAlign: "center" }}>
              <FuzzyText>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: themed(isDark, cs.iridescent.dark, cs.iridescent.light),
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
                    backgroundImage: themed(isDark, cs.body.dark, cs.body.light),
                  }}
                >
                  {description}
                </span>
              </FuzzyText>
            </p>

            {/* Bubble toggle buttons */}
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={thumbnailBubble.isBubbleOpen ? thumbnailBubble.requestPop : thumbnailBubble.openBubble}
                className="group relative px-3 py-1.5 rounded-full text-xs font-medium text-black dark:text-white bg-blue-500/3 hover:bg-blue-500/5 dark:bg-white/5 dark:hover:bg-white/10 border border-[rgba(100,130,200,0.2)] dark:border-[rgba(255,255,255,0.05)] transition-all duration-300"
              >
                <span className="relative z-10">
                  {thumbnailBubble.isBubbleOpen ? "Close" : "Preview"}
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

        {/* Bubbles */}
        <motion.div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999999, pointerEvents: "none", overflow: "visible" }}>
          <AnimatePresence>
            {thumbnailBubble.isBubbleOpen && (
              <BubbleShell
                key="thumbnail"
                side={bubbleSide}
                isMobile={isMobile}
                onPop={thumbnailBubble.handlePop}
                popRequested={thumbnailBubble.popRequested}
                parentInView={isInView}
                desktopYOffset={thumbnailDesktopY}
                mobileYOffset={thumbnailMobileYOffset}
              >
                <ThumbnailBubbleContent thumbnail={thumbnail} isMobile={isMobile} isDark={isDark} />
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
                mobileYOffset={deploymentMobileYOffset}
              >
                <DeploymentBubbleContent deployment={deployment} isMobile={isMobile} isDark={isDark} />
              </BubbleShell>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Mobile spacer — always rendered so it animates smoothly when isMobile changes */}
      <motion.div
        animate={{ height: isMobile && anyBubbleOpen ? (bothBubblesOpen ? 450 : 300) : 0 }}
        transition={{ duration: 0.75, ease: [0.25, 1, 0.5, 1] }}
        style={{ overflow: "hidden" }}
      />
    </>
  );
}
