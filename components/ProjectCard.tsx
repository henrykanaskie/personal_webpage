"use client";

import { useRef, useCallback, useState, useEffect, memo } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useInViewFromBelow } from "@/hooks/useInViewFromBelow";
import { useDrawOnView } from "@/hooks/useDrawOnView";
import AnimatedSvg from "./AnimatedSvg";
import {
  VaporCloud,
  BubbleLayer,
  DismissHint,
  BUBBLE_FROST,
  bubbleMotion,
  isTap,
  useBubblePop,
  useInfoBubble,
  type VaporOrigin,
} from "./InfoBubble";
import { useGlassLens, LiquidBud } from "@/lib/liquid";
import { GlassCard } from "@/lib/glass";
import { rise, settle, leave } from "@/lib/motion";

// ─── Types ───

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface SvgConfig {
  paths: string[];
  size?: number;
  rotate?: number;
  offset?: { x?: number; y?: number };
  corner: Corner;
  drawDuration?: number;
}

export interface ProjectLinks {
  githubUrl?: string;
  siteUrl?: string;
}

export interface Project {
  title: string;
  techStack: string;
  description: string;
  thumbnail?: string;
  links: ProjectLinks;
  svgs?: SvgConfig[];
}

// ─── SVG corner positioning helper ───

function cornerStyle(corner: Corner, offset?: { x?: number; y?: number }): React.CSSProperties {
  const ox = offset?.x ?? 0;
  const oy = offset?.y ?? 0;
  const isTop = corner.startsWith("top");
  const isRight = corner.endsWith("right");

  return {
    ...(isTop ? { top: `${10 + oy}px` } : { bottom: `${10 + oy}px` }),
    ...(isRight ? { right: `${-20 + ox}px` } : { left: `${-20 + ox}px` }),
    transformOrigin: `${isTop ? "top" : "bottom"} ${isRight ? "right" : "left"}`,
  };
}

// ─── Dynamic bubble-mobile detection ───
// Switches to below-card layout when there isn't enough room on either side
// of the row for a side bubble (bubbleWidth 240 + gapFromCard 80 = 320px).
//
// Uses offsetWidth (transform-agnostic) so it's never fooled by the card's
// entry animation.

const BUBBLE_EXTENSION = 320; // bubbleWidth(240) + gapFromCard(80)
const SECTION_PADDING_RATIO = 0.05; // matches md:px-[5%]
const ROW_GAP = 64; // matches md:gap-16

function useBubbleMobile(boxRef: React.RefObject<HTMLDivElement | null>, numCardsInRow: number): boolean | null {
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

      // How much space is left on each side of the row.
      const rowWidth = numCardsInRow * cardWidth + (numCardsInRow - 1) * ROW_GAP;
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
  desktopYOffset = 0,
  mobileYOffset = 0,
  onHeightChange,
  children,
}: {
  side: "left" | "right";
  isMobile: boolean | null;
  onPop: (origin: VaporOrigin) => void;
  popRequested?: boolean;
  parentInView?: boolean;
  desktopYOffset?: number;
  mobileYOffset?: number;
  onHeightChange?: (height: number) => void;
  children: React.ReactNode;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const lens = useGlassLens(bubbleRef, { radius: 40, frost: BUBBLE_FROST });
  // Hidden at its resting spot until LiquidBud has grown the droplet onto it.
  const [budDone, setBudDone] = useState(false);
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

  const isRight = side === "right";
  const [isPressed, setIsPressed] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { isPopping, pop } = useBubblePop(bubbleRef, onPop, popRequested);
  const motionProps = bubbleMotion(isPopping || isPressed, isPopping);

  const rest = showBelow
    ? { top: "100%", x: "-50%", y: `${16 + mobileYOffset}px` }
    : {
        top: "50%",
        y: `calc(-50% + ${desktopYOffset}px)`,
        x: isRight ? "calc(100% + 80px)" : "calc(-100% - 80px)",
      };

  return (
    <>
      {lens.filter}
      <LiquidBud bubbleRef={bubbleRef} bubbleRadius={40} onDone={() => setBudDone(true)} />
      <motion.div
        ref={bubbleRef}
        style={{
          position: "absolute",
          ...(showBelow ? { left: "50%" } : isRight ? { right: 0 } : { left: 0 }),
          width: showBelow ? "min(250px, 85vw)" : 250,
          padding: "16px 20px",
          borderRadius: "40px",
          cursor: "pointer",
          pointerEvents: "auto",
          transformOrigin: showBelow ? "center top" : isRight ? "left center" : "right center",
          zIndex: 9999999,
          ...lens.style,
        }}
        className="glass-bubble"
        onClick={pop}
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
          const start = touchStartRef.current;
          touchStartRef.current = null;
          if ((e.target as Element).closest("a")) return;
          if (isTap(start, e.changedTouches[0])) pop();
        }}
        initial={{ ...rest, opacity: 0 }}
        animate={{ ...rest, ...motionProps.scale, opacity: budDone && (isInView || parentInView) ? 1 : 0 }}
        transition={motionProps.transition}
        exit={motionProps.exit}
        whileHover={motionProps.whileHover}
      >
        {children}
      </motion.div>
    </>
  );
});

// ─── Bubble contents ───

function BubbleHeading({ label }: { label: string }) {
  return (
    <>
      <span className="relative inline-block">
        <span
          className="text-black/50 dark:text-white/50"
          style={{
            fontSize: 9.5,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {label}
        </span>
      </span>
      <div className="bg-black/[0.12] dark:bg-white/[0.15]" style={{ height: 1, margin: "8px 0" }} />
    </>
  );
}

const DISMISS_STYLE: React.CSSProperties = { margin: "8px 0 0", fontSize: 10, pointerEvents: "none" };

const DescriptionBubbleContent = memo(function DescriptionBubbleContent({
  description,
  isMobile,
}: {
  description: string;
  isMobile: boolean | null;
}) {
  return (
    <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
      <BubbleHeading label="About" />
      <p
        className="font-[family-name:var(--font-elevated)]"
        style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.65,
          textAlign: "left",
          color: "var(--body-ink)",
        }}
      >
        {description}
      </p>
      <DismissHint isMobile={isMobile} style={DISMISS_STYLE} />
    </div>
  );
});

function LinkOrPlaceholder({ url, label }: { url?: string; label: string }) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: "auto" }}
        className="metal-surface rounded-full px-3 py-1 transition-transform duration-200 hover:-translate-y-px"
      >
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            fontFamily: "var(--font-elevated)",
            letterSpacing: "0.04em",
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
}

const LinksBubbleContent = memo(function LinksBubbleContent({
  links,
  isMobile,
}: {
  links: ProjectLinks;
  isMobile: boolean | null;
}) {
  return (
    <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
      <BubbleHeading label="Links" />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          pointerEvents: "auto",
        }}
      >
        <LinkOrPlaceholder url={links.githubUrl} label="GitHub" />
        <LinkOrPlaceholder url={links.siteUrl} label="Live Site" />
      </div>
      <DismissHint isMobile={isMobile} style={DISMISS_STYLE} />
    </div>
  );
});

// ─── Project Card ───

const BUBBLE_STACK_OFFSET = 125; // px each bubble shifts from centre when both are open
const BUBBLE_STACK_GAP = 12; // px between the two stacked mobile bubbles
const FALLBACK_STACK_OFFSET = 320; // used until the first bubble has been measured
const BUBBLE_TOP_GAP = 16;
const BUBBLE_BOTTOM_GAP = 20;

const toggleClass =
  "metal-surface group relative px-4 py-1.5 rounded-full text-xs font-semibold transition-transform duration-200 hover:-translate-y-px";

export default function ProjectCard({
  title,
  techStack,
  description,
  thumbnail,
  links,
  svgs = [],
  bubbleSide = "right",
  numCardsInRow = 2,
}: Project & {
  bubbleSide?: "left" | "right";
  numCardsInRow?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const isMobile = useBubbleMobile(boxRef, numCardsInRow);
  const isInView = useInViewFromBelow(boxRef, isMobile ? 0.2 : 0.15);
  const { drawn, onViewportEnter, onViewportLeave } = useDrawOnView();

  const about = useInfoBubble(false);
  const linksBubble = useInfoBubble(false);

  // Track which bubble opened first so the second one pushes the first down
  const firstOpenedRef = useRef<"about" | "links" | null>(null);
  useEffect(() => {
    if (!about.isBubbleOpen && !linksBubble.isBubbleOpen) firstOpenedRef.current = null;
    else if (about.isBubbleOpen && !linksBubble.isBubbleOpen) firstOpenedRef.current = "about";
    else if (linksBubble.isBubbleOpen && !about.isBubbleOpen) firstOpenedRef.current = "links";
  }, [about.isBubbleOpen, linksBubble.isBubbleOpen]);

  const anyBubbleOpen = about.isBubbleOpen || linksBubble.isBubbleOpen;
  const bothBubblesOpen = about.isBubbleOpen && linksBubble.isBubbleOpen;

  // Desktop: when both are open the first-opened shifts down and the newer one up
  const aboutShift = !bothBubblesOpen ? 0 : firstOpenedRef.current === "about" ? BUBBLE_STACK_OFFSET : -BUBBLE_STACK_OFFSET;

  // Measure bubble heights so both the stacked layout and the spacer follow
  // the real content instead of a fixed guess that longer copy overflows.
  const [aboutHeight, setAboutHeight] = useState(0);
  const [linksHeight, setLinksHeight] = useState(0);
  const onAboutHeight = useCallback((h: number) => setAboutHeight(h), []);
  const onLinksHeight = useCallback((h: number) => setLinksHeight(h), []);

  // Mobile: the bubbles stack below the card, About on top
  const stackedOffset = aboutHeight ? aboutHeight + BUBBLE_STACK_GAP : FALLBACK_STACK_OFFSET;
  const spacerHeight = (() => {
    if (!isMobile || !anyBubbleOpen) return 0;
    if (bothBubblesOpen) return stackedOffset + BUBBLE_TOP_GAP + linksHeight + BUBBLE_BOTTOM_GAP;
    return BUBBLE_TOP_GAP + (about.isBubbleOpen ? aboutHeight : linksHeight) + BUBBLE_BOTTOM_GAP;
  })();

  return (
    <div className="flex flex-col items-center w-full md:w-auto">
      {about.vaporOrigin && <VaporCloud origin={about.vaporOrigin} onComplete={about.handleVaporDone} />}
      {linksBubble.vaporOrigin && <VaporCloud origin={linksBubble.vaporOrigin} onComplete={linksBubble.handleVaporDone} />}

      <motion.div
        ref={boxRef}
        initial={rise.hidden}
        animate={isInView ? rise.shown : rise.hidden}
        exit={leave}
        onViewportEnter={onViewportEnter}
        onViewportLeave={onViewportLeave}
        // the right-hand card of a pair arrives a beat after the left
        transition={{ ...settle, delay: !isMobile && bubbleSide === "right" ? 0.08 : 0 }}
        style={{
          position: "relative",
          zIndex: anyBubbleOpen ? 10 : "auto",
          display: "flex",
          flexDirection: "column",
          willChange: "transform",
        }}
        className="w-[calc(100%-2rem)] mx-auto md:mx-0 md:w-[420px] lg:w-[460px] min-h-[280px] md:min-h-[320px]"
      >
        {/* Drawings at the card's corners */}
        {svgs.map((svg, i) => (
          <motion.div
            key={i}
            className="hidden md:block"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{
              position: "absolute",
              ...cornerStyle(svg.corner, svg.offset),
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <AnimatedSvg
              paths={svg.paths}
              size={svg.size ?? 60}
              drawn={drawn}
              rotate={svg.rotate ?? 0}
              duration={svg.drawDuration ?? 3}
            />
          </motion.div>
        ))}

        <GlassCard className="p-5 md:p-8" style={{ flex: 1 }}>
          <h2
            style={{
              marginTop: 0,
              marginBottom: "4px",
              fontSize: "clamp(1.25rem, 2vw, 1.625rem)",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            <span className="relative inline-block">
              <span className="metal-text">{title}</span>
            </span>
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

          <Thumbnail src={thumbnail} title={title} />

          {/* Bubble toggles */}
          <div className="mt-5 flex justify-center gap-3">
            <button onClick={about.isBubbleOpen ? about.requestPop : about.openBubble} className={toggleClass}>
              <span className="relative z-10">{about.isBubbleOpen ? "Close" : "About"}</span>
            </button>
            <button onClick={linksBubble.isBubbleOpen ? linksBubble.requestPop : linksBubble.openBubble} className={toggleClass}>
              <span className="relative z-10">{linksBubble.isBubbleOpen ? "Close" : "Links"}</span>
            </button>
          </div>
        </GlassCard>

        <BubbleLayer>
          <AnimatePresence>
            {about.isBubbleOpen && (
              <BubbleShell
                key="about"
                side={bubbleSide}
                isMobile={isMobile}
                onPop={about.handlePop}
                popRequested={about.popRequested}
                parentInView={isInView}
                desktopYOffset={aboutShift}
                onHeightChange={onAboutHeight}
              >
                <DescriptionBubbleContent description={description} isMobile={isMobile} />
              </BubbleShell>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {linksBubble.isBubbleOpen && (
              <BubbleShell
                key="links"
                side={bubbleSide}
                isMobile={isMobile}
                onPop={linksBubble.handlePop}
                popRequested={linksBubble.popRequested}
                parentInView={isInView}
                desktopYOffset={-aboutShift}
                mobileYOffset={bothBubblesOpen ? stackedOffset : 0}
                onHeightChange={onLinksHeight}
              >
                <LinksBubbleContent links={links} isMobile={isMobile} />
              </BubbleShell>
            )}
          </AnimatePresence>
        </BubbleLayer>
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

// The thumbnail sits behind the same glass as the card, so it reads as
// embedded rather than pasted on. Static, no hover state.
function Thumbnail({ src, title }: { src?: string; title: string }) {
  return (
    <div
      className="relative bg-black/[0.06] dark:bg-white/[0.05] shadow-[inset_0_0_0_1px_rgba(20,30,60,0.10),0_6px_18px_-12px_rgba(20,30,60,0.45)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09),0_6px_18px_-10px_rgba(0,0,0,0.7)]"
      style={{
        borderRadius: 12,
        overflow: "hidden",
        width: "100%",
        aspectRatio: "16 / 9",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src ? (
        <>
          <img
            src={src}
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
            className="pointer-events-none absolute inset-0 opacity-70 bg-[linear-gradient(180deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0)_42%,rgba(20,30,60,0.10)_100%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0)_38%,rgba(6,8,14,0.22)_100%)]"
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
  );
}
