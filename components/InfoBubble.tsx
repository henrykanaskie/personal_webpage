"use client";

import { useRef, useCallback, useState, useEffect, memo } from "react";
import { motion, type TargetAndTransition, type Transition } from "framer-motion";
import { useGlassLens, LiquidBud } from "@/lib/liquid";

// ─── Border Vapor Particle ───
interface BorderParticle {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  rotation: number;
  delay: number;
  duration: number;
  initialOpacity: number;
}

// Sample a random point on a rounded rectangle's border
function sampleRoundedRectBorder(
  halfW: number,
  halfH: number,
  radius: number,
): { x: number; y: number } {
  // Clamp radius so it doesn't exceed half the smaller dimension
  const r = Math.min(radius, halfW, halfH);

  // Perimeter segments: 4 straight edges + 4 quarter-circle arcs
  const straightH = 2 * (halfH - r); // left/right straight edges
  const straightW = 2 * (halfW - r); // top/bottom straight edges
  const arcLen = (Math.PI / 2) * r; // each quarter-circle
  const totalPerim = 2 * straightW + 2 * straightH + 4 * arcLen;

  let t = Math.random() * totalPerim;

  // Top edge (straight, left to right)
  if (t < straightW) {
    return { x: -halfW + r + t, y: -halfH };
  }
  t -= straightW;

  // Top-right arc
  if (t < arcLen) {
    const angle = -Math.PI / 2 + (t / arcLen) * (Math.PI / 2);
    return {
      x: halfW - r + Math.cos(angle) * r,
      y: -halfH + r + Math.sin(angle) * r,
    };
  }
  t -= arcLen;

  // Right edge (straight, top to bottom)
  if (t < straightH) {
    return { x: halfW, y: -halfH + r + t };
  }
  t -= straightH;

  // Bottom-right arc
  if (t < arcLen) {
    const angle = 0 + (t / arcLen) * (Math.PI / 2);
    return {
      x: halfW - r + Math.cos(angle) * r,
      y: halfH - r + Math.sin(angle) * r,
    };
  }
  t -= arcLen;

  // Bottom edge (straight, right to left)
  if (t < straightW) {
    return { x: halfW - r - t, y: halfH };
  }
  t -= straightW;

  // Bottom-left arc
  if (t < arcLen) {
    const angle = Math.PI / 2 + (t / arcLen) * (Math.PI / 2);
    return {
      x: -halfW + r + Math.cos(angle) * r,
      y: halfH - r + Math.sin(angle) * r,
    };
  }
  t -= arcLen;

  // Left edge (straight, bottom to top)
  if (t < straightH) {
    return { x: -halfW, y: halfH - r - t };
  }
  t -= straightH;

  // Top-left arc
  {
    const angle = Math.PI + (t / arcLen) * (Math.PI / 2);
    return {
      x: -halfW + r + Math.cos(angle) * r,
      y: -halfH + r + Math.sin(angle) * r,
    };
  }
}

function generateBorderParticles(
  count: number,
  bubbleWidth: number,
  bubbleHeight: number,
): BorderParticle[] {
  const halfW = bubbleWidth / 2;
  const halfH = bubbleHeight / 2;
  // a square bubble is a circle; everything else uses the soft bubble radius
  const borderRadius = Math.abs(bubbleWidth - bubbleHeight) < 6 ? bubbleWidth / 2 : 40;

  return Array.from({ length: count }, (_, i) => {
    const { x: bx, y: by } = sampleRoundedRectBorder(
      halfW,
      halfH,
      borderRadius,
    );

    // Jitter start position so particles don't all sit exactly on the border
    const normalAngle = Math.atan2(by, bx);
    const jitter = (Math.random() - 0.3) * 12; // bias slightly outward
    const startX = bx + Math.cos(normalAngle) * jitter;
    const startY = by + Math.sin(normalAngle) * jitter;

    // Wide angular spread for a natural burst
    const scatter = (Math.random() - 0.5) * Math.PI * 1.6; // ±144° spread
    const angle = normalAngle + scatter;
    const dist = Math.random() * 55 + 10; // 10–65px travel

    return {
      id: i,
      startX,
      startY,
      endX: startX + Math.cos(angle) * dist,
      endY: startY + Math.sin(angle) * dist,
      size: Math.random() * 1.5 + 0.5,
      rotation: (Math.random() - 0.5) * 360,
      delay: Math.random() * 0.25,
      duration: Math.random() * 0.45 + 0.2,
      initialOpacity: Math.random() * 0.4 + 0.3,
    };
  });
}

// ─── Border Vapor Cloud ───
// Particles originate from the bubble's border and drift outward like mist escaping

export interface VaporOrigin {
  /** Centre of the popped bubble, viewport px */
  x: number;
  y: number;
  w: number;
  h: number;
}

export const VaporCloud = memo(function VaporCloud({
  origin,
  onComplete,
}: {
  origin: VaporOrigin;
  onComplete: () => void;
}) {
  const [particles] = useState(() => {
    const mobile = typeof window !== "undefined" && window.innerWidth < 768;
    return generateBorderParticles(mobile ? 120 : 320, origin.w, origin.h);
  });
  const completedRef = useRef(0);

  const handleDone = useCallback(() => {
    completedRef.current += 1;
    if (completedRef.current >= particles.length) onComplete();
  }, [particles.length, onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        left: origin.x,
        top: origin.y,
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: p.startX,
            y: p.startY,
            scale: 1,
            opacity: p.initialOpacity,
            rotate: 0,
          }}
          animate={{
            x: p.endX,
            y: p.endY,
            scale: 0,
            opacity: 0,
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "linear",
          }}
          onAnimationComplete={handleDone}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
          }}
          className="bg-[radial-gradient(circle,_rgba(0,0,0,0.95)_0%,_rgba(50,80,170,0.4)_50%,_transparent_100%)] dark:bg-[radial-gradient(circle,_rgba(255,255,255,0.8)_0%,_rgba(200,220,255,0.3)_50%,_transparent_100%)]"
        />
      ))}
    </div>
  );
});

// ─── Shared bubble behaviour ───
// The experience card's bubble (InfoBubble, below) and the project cards'
// bubbles (ProjectCard) are the same glass: they share how they frost, move,
// press and pop.

/** The bubble's backdrop, appended after the refracting lens. */
export const BUBBLE_FROST = "blur(1.6px) saturate(1.25) brightness(var(--bubble-lift))";

const SETTLE_SPRING = { type: "spring", stiffness: 170, damping: 26 } as const;
// critically damped: a press settles, it doesn't bounce back
const PRESS_SPRING = { type: "spring", stiffness: 170, damping: 26 } as const;

const POP_TRANSITION: Transition = {
  scale: { duration: 0.08, ease: "easeOut" },
  opacity: { duration: 0.08 },
};
const SETTLE_TRANSITION: Transition = {
  // The droplet itself is drawn by LiquidBud; this element only
  // fades in once the droplet has settled onto its box.
  x: SETTLE_SPRING,
  y: SETTLE_SPRING,
  top: SETTLE_SPRING,
  scaleX: PRESS_SPRING,
  scaleY: PRESS_SPRING,
  // the clear bubble frosts over: a slower crossfade with the droplet
  opacity: { duration: 0.32, ease: "easeInOut" },
};
const BUBBLE_EXIT: TargetAndTransition = { opacity: 0, transition: { duration: 0.001 } };
const BUBBLE_HOVER: TargetAndTransition = { scale: 1.03, transition: { duration: 0.2 } };

/** Motion props for a bubble; spread onto its motion.div alongside its own position. */
export function bubbleMotion(pressedOrPopping: boolean, isPopping: boolean) {
  const scale = pressedOrPopping ? 1.08 : 1;
  return {
    scale: { scaleX: scale, scaleY: scale },
    transition: isPopping ? POP_TRANSITION : SETTLE_TRANSITION,
    exit: BUBBLE_EXIT,
    whileHover: isPopping ? {} : BUBBLE_HOVER,
  };
}

/**
 * Popping: measures the bubble and hands its box to `onPop` (which starts the
 * vapor), once. A parent can also ask for a pop through `popRequested`.
 */
export function useBubblePop(
  bubbleRef: React.RefObject<HTMLElement | null>,
  onPop: (origin: VaporOrigin) => void,
  popRequested?: boolean,
) {
  const [isPopping, setIsPopping] = useState(false);

  const pop = useCallback(() => {
    if (isPopping) return;
    setIsPopping(true);
    if (!bubbleRef.current) return;
    const rect = bubbleRef.current.getBoundingClientRect();
    onPop({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, w: rect.width, h: rect.height });
  }, [isPopping, onPop, bubbleRef]);

  useEffect(() => {
    if (popRequested) pop();
  }, [popRequested, pop]);

  return { isPopping, pop };
}

/** Whether a touch ended close enough to where it started to count as a tap, not a scroll. */
export function isTap(start: { x: number; y: number }, end: { clientX: number; clientY: number }) {
  return Math.abs(end.clientX - start.x) < 10 && Math.abs(end.clientY - start.y) < 10;
}

/** The overlay over a card that its bubbles are positioned in. */
export function BubbleLayer({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </motion.div>
  );
}

// ─── Bubble Info Type ───
export interface BubbleInfo {
  startDate: string; // e.g. "Jan 2023"
  endDate: string; // e.g. "Dec 2024" or "Present"
  techStack: string; // comma-separated, e.g. "React, TypeScript, Node.js"
  location: string; // e.g. "Austin, TX"
  industry: string; // e.g. "Aerospace"
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function parseDateStr(s: string): Date {
  if (s.toLowerCase() === "present") return new Date();
  const parts = s.trim().split(/\s+/);
  const month = Math.max(0, MONTHS.indexOf(parts[0].toLowerCase().slice(0, 3)));
  const year = parseInt(parts[1], 10);
  return new Date(year, month);
}

const plural = (n: number, unit: string) => `${n} ${unit}${n !== 1 ? "s" : ""}`;

function calcDuration(start: string, end: string): string {
  const s = parseDateStr(start);
  const e = parseDateStr(end);
  const months = Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
  const yrs = Math.floor(months / 12);
  const mo = months % 12;
  if (yrs === 0) return plural(mo, "month");
  if (mo === 0) return plural(yrs, "yr");
  return `${plural(yrs, "yr")} ${mo} mo`;
}

// ─── Mitosis Bubble ───
// `side`: "right" means the bubble pops out to the right (for a left-hand card),
//         "left"  means it pops out to the left  (for a right-hand card).

/** Gap between the card's side and the bubble, desktop */
const BUBBLE_GAP = 100;

const smallCaps = { fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em" } as const;
const divider = (margin: string) => <div className="bg-black/[0.22] dark:bg-white/[0.15]" style={{ height: 1, margin }} />;

export function InfoBubble({
  extraInfo,
  side,
  onPop,
  isMobile,
  popRequested,
  parentInView,
}: {
  extraInfo: BubbleInfo;
  side: "left" | "right";
  onPop: (origin: VaporOrigin) => void;
  isMobile: boolean | null;
  popRequested?: boolean;
  parentInView?: boolean;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const lens = useGlassLens(bubbleRef, { radius: 32, frost: BUBBLE_FROST });
  // Hidden at its resting spot until LiquidBud has grown the droplet onto it.
  const [budDone, setBudDone] = useState(false);
  const showBelow = isMobile;
  const isRight = side === "right";
  const [isPressed, setIsPressed] = useState(false);
  const { isPopping, pop } = useBubblePop(bubbleRef, onPop, popRequested);
  const motionProps = bubbleMotion(isPopping || isPressed, isPopping);

  // Track touch start position to distinguish scroll from tap
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onLink = (e: React.SyntheticEvent) => !!(e.target as HTMLElement).closest("a");

  // NOTE: We intentionally do not auto-scroll the page on mobile.
  // Auto-centering caused unexpected jumps on initial page load (especially on /cs).

  const sideAnchor = showBelow ? { left: "50%" } : isRight ? { right: 0 } : { left: 0 };
  const rest = showBelow
    ? { x: "-50%", y: "16px" }
    : { y: "-50%", x: isRight ? `calc(100% + ${BUBBLE_GAP}px)` : `calc(-100% - ${BUBBLE_GAP}px)` };

  return (
    <>
      {lens.filter}
      <LiquidBud bubbleRef={bubbleRef} bubbleRadius={32} onDone={() => setBudDone(true)} />
      <motion.div
        ref={bubbleRef}
        style={{
          position: "absolute",
          top: showBelow ? "100%" : "50%",
          ...sideAnchor,
          // a soft rectangular bubble, like the cards it grows out of
          width: showBelow ? "min(280px, 86vw)" : 280,
          padding: "22px 26px",
          borderRadius: 32,
          cursor: "pointer",
          pointerEvents: "auto",
          transformOrigin: showBelow ? "center top" : isRight ? "left center" : "right center",
          zIndex: 9999999,
          willChange: "auto",
          ...lens.style,
        }}
        className="glass-bubble"
        onClick={(e) => {
          if (onLink(e)) return;
          pop();
        }}
        initial={{ ...rest, opacity: 0 }}
        onMouseDown={(e) => {
          if (onLink(e)) return;
          setIsPressed(true);
        }}
        onMouseUp={(e) => {
          if (onLink(e)) return;
          pop();
        }}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={(e) => {
          if (onLink(e)) return;
          setIsPressed(true);
          const t = e.touches[0];
          touchStartRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          setIsPressed(false);
          if (onLink(e)) return;
          if (!touchStartRef.current) return;
          if (isTap(touchStartRef.current, e.changedTouches[0])) pop();
          touchStartRef.current = null;
        }}
        animate={{ ...rest, ...motionProps.scale, opacity: budDone && parentInView ? 1 : 0 }}
        transition={motionProps.transition}
        exit={motionProps.exit}
        whileHover={motionProps.whileHover}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            pointerEvents: "auto",
            textAlign: "center",
          }}
        >
          {/* Duration */}
          <div>
            <span className="relative inline-block">
              <span className="text-black dark:text-white" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>
                {calcDuration(extraInfo.startDate, extraInfo.endDate)}
              </span>
            </span>
          </div>
          <div style={{ marginTop: 4 }}>
            <span className="relative inline-block">
              <span className="text-black/60 dark:text-white/40" style={{ fontSize: 9, letterSpacing: "0.04em" }}>
                {extraInfo.startDate} – {extraInfo.endDate}
              </span>
            </span>
          </div>

          {divider("7px 12px")}

          {/* Tech Stack */}
          <span className="relative inline-block">
            <span className="text-black/70 dark:text-white/50" style={smallCaps}>
              Stack
            </span>
          </span>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginTop: 6,
              justifyContent: "center",
            }}
          >
            {extraInfo.techStack.split(",").map((tech) => (
              <span
                key={tech.trim()}
                className="text-black/90 dark:text-white/80 bg-black/[0.07] dark:bg-white/[0.06] border border-black/[0.18] dark:border-white/[0.08]"
                style={{
                  fontSize: 9,
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

          {divider("8px 12px")}
          <BubbleFact label="Industry" value={extraInfo.industry} />
          {divider("7px 12px")}
          <BubbleFact label="Location" value={extraInfo.location} />

          <DismissHint isMobile={isMobile} style={{ margin: "7px 0 0", fontSize: 9 }} />
        </div>
      </motion.div>
    </>
  );
}

function BubbleFact({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="relative inline-block">
        <span className="text-black/60 dark:text-white/40" style={smallCaps}>
          {label}
        </span>
      </span>
      <div style={{ marginTop: 3 }}>
        <span className="relative inline-block">
          <span className="text-black/80 dark:text-white/80" style={{ fontSize: 11, fontWeight: 500 }}>
            {value}
          </span>
        </span>
      </div>
    </>
  );
}

/** "tap to dismiss" / "click to dismiss", faint, at the foot of a bubble. */
export function DismissHint({ isMobile, style }: { isMobile: boolean | null; style: React.CSSProperties }) {
  return (
    <p style={{ ...style, opacity: 0.4 }} className="text-black dark:text-white">
      {isMobile ? "tap to dismiss" : "click to dismiss"}
    </p>
  );
}

// ─── Hook for managing bubble state ───
// `initialOpen` defaults to true for InfoBox, whose bubble is part of the box's
// resting composition. ProjectCard opts out: eight cards' worth of bubbles open
// at once buries the cards they belong to.
export function useInfoBubble(initialOpen = true) {
  const [isBubbleOpen, setIsBubbleOpen] = useState(initialOpen);
  const [popRequested, setPopRequested] = useState(false);
  const [vaporOrigin, setVaporOrigin] = useState<VaporOrigin | null>(null);

  const handlePop = useCallback((origin: VaporOrigin) => {
    setIsBubbleOpen(false);
    setPopRequested(false);
    // Defer vapor cloud to next frame so bubble exit doesn't compete
    requestAnimationFrame(() => setVaporOrigin(origin));
  }, []);

  const handleVaporDone = useCallback(() => setVaporOrigin(null), []);
  const openBubble = useCallback(() => setIsBubbleOpen(true), []);
  const requestPop = useCallback(() => setPopRequested(true), []);

  return { isBubbleOpen, popRequested, vaporOrigin, handlePop, handleVaporDone, openBubble, requestPop };
}
