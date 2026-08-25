"use client";

import { useRef, useCallback, useState, useEffect, memo } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useInViewFromBelow } from "../hooks/useInViewFromBelow";
import { useSvgDrawAnimation } from "../hooks/useSvgDrawAnimation";
import AnimatedSvg from "./AnimatedSvg";
import { VaporCloud, useInfoBubble } from "./InfoBubble";
import {
  glassStyle,
  GlassLayers,
  FuzzyText,
  useIsDark,
} from "../lib/glass";
import {
  glassBubbleClassNames,
  glassBoxClassNames,
  cs,
  themed,
} from "../lib/tokens";

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
  numCardsInRow?: number;
}

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

// ─── Dynamic bubble-mobile detection ───
// Switches to below-card layout when there isn't enough room on either side
// of the row for a side bubble (bubbleWidth 240 + gapFromCard 80 = 320px).
//
// Uses offsetWidth (transform-agnostic) so it's never fooled by the entry
// animation that starts the card off-screen at x: ±100vw.

const BUBBLE_EXTENSION = 320; // bubbleWidth(240) + gapFromCard(80)
const SECTION_PADDING_RATIO = 0.05; // matches md:px-[5%]
const ROW_GAP = 64; // matches md:gap-16

function useBubbleMobile(
  boxRef: React.RefObject<HTMLDivElement | null>,
  numCardsInRow: number,
): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      const W = window.innerWidth;
      if (W < 768) {
        setIsMobile(true);
        return;
      }

      const cardWidth = boxRef.current?.offsetWidth ?? 0;
      if (cardWidth === 0) return;

      // Compute how much space is available on each side of the row.
      // offsetWidth is unaffected by CSS transforms, so this is correct
      // even while the card is mid-animation.
      const rowWidth =
        numCardsInRow * cardWidth + (numCardsInRow - 1) * ROW_GAP;
      const sectionPadding = SECTION_PADDING_RATIO * W;
      const availableWidth = W - 2 * sectionPadding;
      const spaceOnSide = (availableWidth - rowWidth) / 2 + sectionPadding;

      setIsMobile(spaceOnSide < BUBBLE_EXTENSION);
    };

    const ro = new ResizeObserver(check);
    if (boxRef.current) ro.observe(boxRef.current);
    window.addEventListener("resize", check);
    check();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [boxRef, numCardsInRow]);

  return isMobile;
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
  mobileBubbleX,
  onHeightChange,
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
  mobileBubbleX?: string;
  onHeightChange?: (height: number) => void;
  children: React.ReactNode;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(bubbleRef, { once: false, amount: 0.4 });
  const showBelow = isMobile;

  useEffect(() => {
    if (!onHeightChange || !bubbleRef.current) return;
    const el = bubbleRef.current;
    const ro = new ResizeObserver(() => onHeightChange(el.offsetHeight));
    ro.observe(el);
    onHeightChange(el.offsetHeight);
    return () => ro.disconnect();
  }, [onHeightChange]);
  const [isPopping, setIsPopping] = useState(false);
  const isRight = side === "right";
  const [isPressed, setIsPressed] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleClick = useCallback(() => {
    if (isPopping) return;
    setIsPopping(true);
    if (!bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    onPop(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      rect.width,
      rect.height,
    );
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
        transformOrigin: showBelow
          ? "center top"
          : isRight
            ? "left center"
            : "right center",
        zIndex: 9999999,
        ...glassStyle,
      }}
      className={glassBubbleClassNames}
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
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
        touchStartRef.current = null;
        if ((e.target as Element).closest("a")) return;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) handleClick();
      }}
      initial={
        showBelow
          ? {
              top: "100%",
              x: "-50%",
              y: "0%",
              scaleX: 0.5,
              scaleY: 0.15,
              opacity: 0,
            }
          : {
              top: "50%",
              y: "-50%",
              x: isRight ? "30%" : "-30%",
              scaleX: 0.15,
              scaleY: 0.3,
              opacity: 0,
            }
      }
      animate={
        showBelow
          ? {
              top: "100%",
              x: mobileBubbleX ?? "-50%",
              y: `${16 + mYOff}px`,
              scaleX: isPopping || isPressed ? 1.08 : 1,
              scaleY: isPopping || isPressed ? 1.08 : 1,
              opacity: isInView || parentInView ? 1 : 0,
            }
          : {
              top: "50%",
              y: `calc(-50% + ${dYOff}px)`,
              x:
                desktopX !== undefined
                  ? desktopX
                  : isRight
                    ? "calc(100% + 80px)"
                    : "calc(-100% - 80px)",
              scaleX: isPopping || isPressed ? 1.08 : 1,
              scaleY: isPopping || isPressed ? 1.08 : 1,
              opacity: isInView || parentInView ? 1 : 0,
            }
      }
      transition={
        isPopping
          ? {
              scale: { duration: 0.08, ease: "easeOut" },
              opacity: { duration: 0.08 },
            }
          : {
              duration: 0.75,
              ease: [0.34, 1.56, 0.64, 1],
              top: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
              x: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
              opacity: { duration: 0.9, ease: "easeInOut" },
            }
      }
      exit={{ opacity: 0, transition: { duration: 0.001 } }}
      whileHover={
        isPopping ? {} : { scale: 1.03, transition: { duration: 0.2 } }
      }
    >
      <GlassLayers refractionSide="left" specularInset="15%" />

      {children}
    </motion.div>
  );
});

// ─── Description Bubble Content ───

const DescriptionBubbleContent = memo(function DescriptionBubbleContent({
  description,
  isMobile,
  isDark,
}: {
  description: string;
  isMobile: boolean | null;
  isDark: boolean;
}) {
  return (
    <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
      <FuzzyText style={{ margin: 0 }}>
        <span
          className="text-black/50 dark:text-white/50"
          style={{
            fontSize: 9.5,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          About
        </span>
      </FuzzyText>
      <div
        className="bg-black/[0.12] dark:bg-white/[0.15]"
        style={{ height: 1, margin: "8px 0" }}
      />
      <p
        className="font-[family-name:var(--font-elevated)]"
        style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.65,
          textAlign: "left",
          color: themed(isDark, cs.bodyColor.dark, cs.bodyColor.light),
        }}
      >
        {description}
      </p>
      <p
        style={{
          margin: "8px 0 0",
          fontSize: 10,
          opacity: 0.4,
          pointerEvents: "none",
        }}
        className="text-black dark:text-white"
      >
        {isMobile ? "tap to dismiss" : "click to dismiss"}
      </p>
    </div>
  );
});

// ─── Deployment Bubble Content ───

const DeploymentBubbleContent = memo(function DeploymentBubbleContent({
  deployment,
  isMobile,
}: {
  deployment: DeploymentInfo;
  isMobile: boolean | null;
  isDark: boolean;
}) {
  const LinkOrPlaceholder = ({
    url,
    label,
  }: {
    url?: string;
    label: string;
  }) => {
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
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-elevated)",
              letterSpacing: "0.04em",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            {label}
          </span>
        </a>
      );
    }
    return (
      <span className="flex items-center gap-2">
        <span
          className="text-black/30 dark:text-white/30"
          style={{
            fontSize: 10,
            fontFamily: "var(--font-elevated)",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
        <span
          className="bg-black/20 dark:bg-white/20"
          style={{
            width: 24,
            height: 1,
            display: "inline-block",
            borderRadius: 1,
          }}
        />
      </span>
    );
  };

  return (
    <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
      <FuzzyText style={{ margin: 0 }}>
        <span
          className="text-black/50 dark:text-white/50"
          style={{
            fontSize: 9.5,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Links
        </span>
      </FuzzyText>
      <div
        className="bg-black/[0.12] dark:bg-white/[0.15]"
        style={{ height: 1, margin: "8px 0" }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          pointerEvents: "auto",
        }}
      >
        <LinkOrPlaceholder url={deployment.githubUrl} label="GitHub" />
        <LinkOrPlaceholder url={deployment.siteUrl} label="Live Site" />
      </div>

      <p
        style={{
          margin: "8px 0 0",
          fontSize: 10,
          opacity: 0.4,
          pointerEvents: "none",
        }}
        className="text-black dark:text-white"
      >
        {isMobile ? "tap to dismiss" : "click to dismiss"}
      </p>
    </div>
  );
});

// ─── Project Card ───

const BUBBLE_STACK_OFFSET = 125; // px the second bubble shifts when both open
const BUBBLE_STACK_GAP = 12; // px between the two stacked mobile bubbles
const FALLBACK_STACK_OFFSET = 320; // used until the first bubble has been measured

export default function ProjectCard({
  title,
  techStack,
  description,
  thumbnail,
  deployment,
  svgs = [],
  bubbleSide = "right",
  numCardsInRow = 2,
}: ProjectCardProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const isMobile = useBubbleMobile(boxRef, numCardsInRow);

  const isDark = useIsDark();
  const isInView = useInViewFromBelow(boxRef, isMobile ? 0.2 : 0.15);

  const thumbnailBubble = useInfoBubble(false);
  const deploymentBubble = useInfoBubble(false);

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

  const anyBubbleOpen =
    thumbnailBubble.isBubbleOpen || deploymentBubble.isBubbleOpen;
  const bothBubblesOpen =
    thumbnailBubble.isBubbleOpen && deploymentBubble.isBubbleOpen;
  // When both are open, the first-opened gets pushed down, the newer one sits on top
  const thumbnailIsFirst = firstOpenedRef.current === "thumbnail";

  // Desktop: first-opened shifts down, second stays up
  const thumbnailDesktopY = bothBubblesOpen
    ? thumbnailIsFirst
      ? BUBBLE_STACK_OFFSET
      : -BUBBLE_STACK_OFFSET
    : 0;
  const deploymentDesktopY = bothBubblesOpen
    ? thumbnailIsFirst
      ? -BUBBLE_STACK_OFFSET
      : BUBBLE_STACK_OFFSET
    : 0;

  const showSideBySide = false;

  // Measure bubble heights so both the stacked layout and the spacer follow
  // the real content instead of a fixed guess that longer copy overflows.
  const [thumbnailHeight, setThumbnailHeight] = useState(0);
  const [deploymentHeight, setDeploymentHeight] = useState(0);
  const onThumbnailHeight = useCallback((h: number) => setThumbnailHeight(h), []);
  const onDeploymentHeight = useCallback((h: number) => setDeploymentHeight(h), []);

  // Mobile: stacked vertically on true mobile, side by side otherwise
  const stackedBubbleOffset = thumbnailHeight
    ? thumbnailHeight + BUBBLE_STACK_GAP
    : FALLBACK_STACK_OFFSET;
  const thumbnailMobileYOffset = 0;
  const deploymentMobileYOffset = showSideBySide
    ? 0
    : bothBubblesOpen
      ? stackedBubbleOffset
      : 0;
  const thumbnailMobileBubbleX = showSideBySide ? "calc(-100% - 8px)" : "-50%";
  const deploymentMobileBubbleX = showSideBySide ? "8px" : "-50%";

  const BUBBLE_TOP_GAP = 16;
  const BUBBLE_BOTTOM_GAP = 20;
  const spacerHeight = (() => {
    if (!isMobile || !anyBubbleOpen) return 0;
    if (showSideBySide)
      return BUBBLE_TOP_GAP + Math.max(thumbnailHeight, deploymentHeight) + BUBBLE_BOTTOM_GAP;
    if (bothBubblesOpen)
      return (
        stackedBubbleOffset +
        BUBBLE_TOP_GAP +
        deploymentHeight +
        BUBBLE_BOTTOM_GAP
      );
    const h = thumbnailBubble.isBubbleOpen ? thumbnailHeight : deploymentHeight;
    return BUBBLE_TOP_GAP + h + BUBBLE_BOTTOM_GAP;
  })();

  // SVG draw progress
  const { svgProgress, onViewportEnter, onViewportLeave } =
    useSvgDrawAnimation(3);

  return (
    <div className="flex flex-col items-center w-full md:w-auto">
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
            : {
                x: isMobile ? 0 : bubbleSide === "left" ? -20 : 20,
                y: isMobile ? 15 : 10,
              }
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
          style={{
            position: "relative",
            borderRadius: "24px",
            flex: 1,
            ...glassStyle,
          }}
          className={`${glassBoxClassNames} p-5 md:p-8`}
        >
          <GlassLayers refractionSide="left" />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Title */}
            <h2
              style={{
                marginTop: 0,
                marginBottom: "4px",
                fontSize: "clamp(1.25rem, 2vw, 1.625rem)",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              <FuzzyText>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: themed(
                      isDark,
                      cs.liquidGlass.dark,
                      cs.liquidGlass.light,
                    ),
                  }}
                >
                  {title}
                </span>
              </FuzzyText>
            </h2>

            {/* Tech Stack */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              {techStack.split(",").map((tech) => (
                <span
                  key={tech.trim()}
                  className="text-black/70 dark:text-white/70 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08]"
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-elevated)",
                    padding: "2px 6px",
                    borderRadius: 6,
                    letterSpacing: "0.04em",
                  }}
                >
                  {tech.trim()}
                </span>
              ))}
            </div>

            {/* Thumbnail: sits behind the same glass as the card, so it reads
                as embedded rather than pasted on. Static, no hover state. */}
            <div
              className="relative"
              style={{
                borderRadius: 12,
                overflow: "hidden",
                width: "100%",
                aspectRatio: "16 / 9",
                marginBottom: 16,
                background: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.06)",
                boxShadow: isDark
                  ? "inset 0 0 0 1px rgba(255,255,255,0.09), 0 6px 18px -10px rgba(0,0,0,0.7)"
                  : "inset 0 0 0 1px rgba(20,30,60,0.10), 0 6px 18px -12px rgba(20,30,60,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {thumbnail ? (
                <>
                  <img
                    src={thumbnail}
                    alt={`${title} preview`}
                    loading="lazy"
                    decoding="async"
                    width={1600}
                    height={900}
                    className="h-full w-full object-cover block saturate-[0.82] contrast-[1.02]"
                  />
                  {/* specular sheen, matching the glass surfaces around it */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-70"
                    style={{
                      background: isDark
                        ? "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 38%, rgba(6,8,14,0.22) 100%)"
                        : "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 42%, rgba(20,30,60,0.10) 100%)",
                    }}
                  />
                </>
              ) : (
                <span
                  className="text-black/20 dark:text-white/20"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Preview
                </span>
              )}
            </div>

            {/* Bubble toggle buttons */}
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={
                  thumbnailBubble.isBubbleOpen
                    ? thumbnailBubble.requestPop
                    : thumbnailBubble.openBubble
                }
                className="group relative px-3 py-1.5 rounded-full text-xs font-medium text-black dark:text-white bg-blue-500/3 hover:bg-blue-500/5 dark:bg-white/5 dark:hover:bg-white/10 border border-[rgba(100,130,200,0.2)] dark:border-[rgba(255,255,255,0.05)] transition-all duration-300"
              >
                <span className="relative z-10">
                  {thumbnailBubble.isBubbleOpen ? "Close" : "About"}
                </span>
              </button>
              <button
                onClick={
                  deploymentBubble.isBubbleOpen
                    ? deploymentBubble.requestPop
                    : deploymentBubble.openBubble
                }
                className="group relative px-3 py-1.5 rounded-full text-xs font-medium text-black dark:text-white bg-blue-500/3 hover:bg-blue-500/5 dark:bg-white/5 dark:hover:bg-white/10 border border-[rgba(100,130,200,0.2)] dark:border-[rgba(255,255,255,0.05)] transition-all duration-300"
              >
                <span className="relative z-10">
                  {deploymentBubble.isBubbleOpen ? "Close" : "Links"}
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bubbles */}
        <motion.div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999999,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
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
                mobileBubbleX={thumbnailMobileBubbleX}
                onHeightChange={onThumbnailHeight}
              >
                <DescriptionBubbleContent
                  description={description}
                  isMobile={isMobile}
                  isDark={isDark}
                />
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
                mobileBubbleX={deploymentMobileBubbleX}
                onHeightChange={onDeploymentHeight}
              >
                <DeploymentBubbleContent
                  deployment={deployment}
                  isMobile={isMobile}
                  isDark={isDark}
                />
              </BubbleShell>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Spacer reserving room for the below-card bubbles: height driven by
          actual bubble measurements. It lives inside this column (rather than
          beside the card as a row-level flex item) so that on a multi-row grid
          it pushes the following row down instead of only growing the row. */}
      <motion.div
        className="w-full"
        animate={{ height: spacerHeight }}
        transition={{ duration: 0.75, ease: [0.25, 1, 0.5, 1] }}
        style={{ overflow: "hidden" }}
      />
    </div>
  );
}
