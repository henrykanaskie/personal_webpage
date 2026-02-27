"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { FuzzyText } from "./LeftInfoBox";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile ?? false;
}

export function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    setIsDark(el.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(el.classList.contains("dark"));
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

// ─── Shared glass styling ───
export const glassStyle: React.CSSProperties = {
  backdropFilter: "blur(1.3px) saturate(1.15)",
  WebkitBackdropFilter: "blur(1.3px) saturate(1.15)",
};

export const glassBubbleClassNames = `
  bg-white/[0.35]
  border border-[rgba(80,150,255,0.18)]
  shadow-[inset_0_1px_0_rgba(80,150,255,0.12)]
  shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]

  dark:bg-white/[0.02]
  dark:border-[rgba(255,255,255,0.06)]
  dark:border-t-[rgba(255,255,255,0.1)]
  dark:border-r-[rgba(255,255,255,0.04)]
  dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
`;

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
  const borderRadius = 24; // matches the bubble's borderRadius

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
export function VaporCloud({
  originX,
  originY,
  bubbleWidth,
  bubbleHeight,
  onComplete,
}: {
  originX: number;
  originY: number;
  bubbleWidth: number;
  bubbleHeight: number;
  onComplete: () => void;
}) {
  const [particles] = useState(() => {
    const mobile = typeof window !== "undefined" && window.innerWidth < 768;
    return generateBorderParticles(
      mobile ? 120 : 450,
      bubbleWidth,
      bubbleHeight,
    );
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
        left: originX,
        top: originY,
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
          className="bg-[radial-gradient(circle,_rgba(40,70,180,0.95)_0%,_rgba(50,80,170,0.4)_50%,_transparent_100%)] dark:bg-[radial-gradient(circle,_rgba(255,255,255,0.8)_0%,_rgba(200,220,255,0.3)_50%,_transparent_100%)]"
        />
      ))}
    </div>
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

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function parseDateStr(s: string): Date {
  if (s.toLowerCase() === "present") return new Date();
  const parts = s.trim().split(/\s+/);
  const month = MONTH_MAP[parts[0].toLowerCase().slice(0, 3)] ?? 0;
  const year = parseInt(parts[1], 10);
  return new Date(year, month);
}

function calcDuration(start: string, end: string): string {
  const s = parseDateStr(start);
  const e = parseDateStr(end);
  let months =
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (months < 0) months = 0;
  const yrs = Math.floor(months / 12);
  const mo = months % 12;
  if (yrs === 0) return `${mo} month${mo !== 1 ? "s" : ""}`;
  if (mo === 0) return `${yrs} yr${yrs !== 1 ? "s" : ""}`;
  return `${yrs} yr${yrs !== 1 ? "s" : ""} ${mo} mo`;
}

// ─── Mitosis Bubble ───
// `side`: "right" means bubble pops out to the right (for LeftInfoBox)
//         "left"  means bubble pops out to the left  (for RightInfoBox)
const BUBBLE_REST_OFFSET = 300;

export function InfoBubble({
  extraInfo,
  side,
  onPop,
  isMobile,
  popRequested,
  onVisibilityChange,
  parentInView,
}: {
  extraInfo: BubbleInfo;
  side: "left" | "right";
  onPop: (x: number, y: number, w: number, h: number) => void;
  isMobile: boolean;
  popRequested?: boolean;
  onVisibilityChange?: (inView: boolean) => void;
  parentInView?: boolean;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isBubbleInView = useInView(bubbleRef, { once: false, amount: 0.4 });

  useEffect(() => {
    onVisibilityChange?.(isBubbleInView);
  }, [isBubbleInView, onVisibilityChange]);
  const [isPopping, setIsPopping] = useState(false);
  const isRight = side === "right";
  const [isPressed, setIsPressed] = useState(false);

  // Track touch start position to distinguish scroll from tap
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

  // Scroll bubble into center of viewport after entrance animation (mobile only)
  useEffect(() => {
    if (!isMobile) return;
    const timer = setTimeout(() => {
      if (!bubbleRef.current) return;
      const rect = bubbleRef.current.getBoundingClientRect();
      const bubbleCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const offset = bubbleCenter - viewportCenter;
      if (Math.abs(offset) > 50) {
        window.scrollBy({ top: offset, behavior: "smooth" });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isMobile]);

  const sideAnchor = isMobile
    ? { left: "50%" }
    : isRight
      ? { right: 0 }
      : { left: 0 };

  return (
    <>
      <motion.div
        ref={bubbleRef}
        style={{
          position: "absolute",
          top: isMobile ? "100%" : "50%",
          ...sideAnchor,
          width: isMobile ? "min(260px, 85vw)" : 260,
          padding: "20px 24px",
          borderRadius: "24px",
          cursor: "pointer",
          pointerEvents: "auto",
          transformOrigin: isMobile
            ? "center top"
            : isRight
              ? "left center"
              : "right center",
          zIndex: 9999999,
          willChange: "auto",
          ...glassStyle,
        }}
        className={glassBubbleClassNames}
        onClick={handleClick}
        initial={
          isMobile
            ? { x: "-50%", y: "0%", scaleX: 0.5, scaleY: 0.15, opacity: 0 }
            : {
                y: "-50%",
                x: isRight ? "30%" : "-30%",
                scaleX: 0.15,
                scaleY: 0.3,
                opacity: 0,
              }
        }
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
          // Only treat as tap if finger moved less than 10px
          if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            handleClick();
          }
          touchStartRef.current = null;
        }}
        animate={
          isMobile
            ? {
                x: "-50%",
                y: "16px",
                scaleX: isPopping || isPressed ? 1.08 : 1,
                scaleY: isPopping || isPressed ? 1.08 : 1,
                opacity: isBubbleInView || parentInView ? 1 : 0,
              }
            : {
                y: "-50%",
                x: isRight
                  ? `calc(100% + ${BUBBLE_REST_OFFSET - 200}px)`
                  : `calc(-100% - ${BUBBLE_REST_OFFSET - 200}px)`,
                scaleX: isPopping || isPressed ? 1.08 : 1,
                scaleY: isPopping || isPressed ? 1.08 : 1,
                opacity: isBubbleInView || parentInView ? 1 : 0,
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
                opacity: {
                  duration: isBubbleInView ? 0.3 : 1.4,
                  ease: "easeInOut",
                },
              }
        }
        exit={{ opacity: 0, transition: { duration: 0.001 } }}
        whileHover={
          isPopping ? {} : { scale: 1.03, transition: { duration: 0.2 } }
        }
      >
        {/* Internal refraction gradient (Matches the Box) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            zIndex: 0,
            background: isRight
              ? "radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.02) 30%, transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(200,220,255,0.05) 0%, transparent 50%)"
              : "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.02) 30%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200,220,255,0.05) 0%, transparent 50%)",
          }}
        />

        {/* Edge distortion layer (Matches the Box) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            zIndex: 0,
            WebkitMaskImage:
              "radial-gradient(ellipse at center, transparent 55%, black 100%)",
            maskImage:
              "radial-gradient(ellipse at center, transparent 55%, black 100%)",
            backdropFilter: "blur(3px) saturate(1.1)",
            WebkitBackdropFilter: "blur(3px) saturate(1.1)",
          }}
        />

        {/* Specular highlight */}
        <div
          className="dark:hidden"
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: "1px",
            borderRadius: "inherit",
            pointerEvents: "none",
            background:
              "linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 70%, transparent)",
          }}
        />
        <div
          className="hidden dark:block"
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: "1px",
            borderRadius: "inherit",
            pointerEvents: "none",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 70%, transparent)",
          }}
        />

        {/* Bottom specular highlight */}
        <div
          className="dark:hidden"
          style={{
            position: "absolute",
            bottom: 0,
            left: "15%",
            right: "15%",
            height: "1px",
            borderRadius: "inherit",
            pointerEvents: "none",
            background:
              "linear-gradient(90deg, transparent, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.04) 70%, transparent)",
          }}
        />
        <div
          className="hidden dark:block"
          style={{
            position: "absolute",
            bottom: 0,
            left: "15%",
            right: "15%",
            height: "1px",
            borderRadius: "inherit",
            pointerEvents: "none",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.2) 70%, transparent)",
          }}
        />

        {/* Chromatic aberration */}
        <div
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: "inherit",
            pointerEvents: "none",
            boxShadow:
              "inset 2px 0 8px rgba(255,0,80,0.04), inset -2px 0 8px rgba(0,100,255,0.04), inset 0 2px 8px rgba(255,200,0,0.03), inset 0 -2px 8px rgba(0,200,255,0.03)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          {/* Duration */}
          <div>
            <FuzzyText style={{ margin: 0 }}>
              <span
                className="text-black dark:text-white"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {calcDuration(extraInfo.startDate, extraInfo.endDate)}
              </span>
            </FuzzyText>
          </div>
          <div style={{ marginTop: 4 }}>
            <FuzzyText style={{ margin: 0 }}>
              <span
                className="text-black/40 dark:text-white/40"
                style={{ fontSize: 9, letterSpacing: "0.04em" }}
              >
                {extraInfo.startDate} — {extraInfo.endDate}
              </span>
            </FuzzyText>
          </div>

          <div
            className="bg-black/[0.12] dark:bg-white/[0.15]"
            style={{ height: 1, margin: "10px 0" }}
          />

          {/* Tech Stack */}
          <FuzzyText style={{ margin: 0 }}>
            <span
              className="text-black/50 dark:text-white/50"
              style={{
                fontSize: 8,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Stack
            </span>
          </FuzzyText>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginTop: 11,
              justifyContent: "center",
            }}
          >
            {extraInfo.techStack.split(",").map((tech) => (
              <span
                key={tech.trim()}
                className="text-black/80 dark:text-white/80 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08]"
                style={{
                  fontSize: 9,
                  fontFamily: "monospace",
                  padding: "2px 6px",
                  borderRadius: 6,
                  letterSpacing: "0.02em",
                }}
              >
                {tech.trim()}
              </span>
            ))}
          </div>

          <div
            className="bg-black/[0.12] dark:bg-white/[0.15]"
            style={{ height: 1, margin: "12px 0" }}
          />

          {/* Industry */}
          <FuzzyText style={{ margin: 0 }}>
            <span
              className="text-black/40 dark:text-white/40"
              style={{
                fontSize: 8,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Industry
            </span>
          </FuzzyText>
          <div style={{ marginTop: 3 }}>
            <FuzzyText style={{ margin: 0 }}>
              <span
                className="text-black/80 dark:text-white/80"
                style={{ fontSize: 11, fontWeight: 500 }}
              >
                {extraInfo.industry}
              </span>
            </FuzzyText>
          </div>

          <div
            className="bg-black/[0.12] dark:bg-white/[0.15]"
            style={{ height: 1, margin: "10px 0" }}
          />

          {/* Location */}
          <FuzzyText style={{ margin: 0 }}>
            <span
              className="text-black/40 dark:text-white/40"
              style={{
                fontSize: 8,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Location
            </span>
          </FuzzyText>
          <div style={{ marginTop: 3 }}>
            <FuzzyText style={{ margin: 0 }}>
              <span
                className="text-black/80 dark:text-white/80"
                style={{ fontSize: 11, fontWeight: 500 }}
              >
                {extraInfo.location}
              </span>
            </FuzzyText>
          </div>

          <p
            style={{ margin: "10px 0 0", fontSize: 10, opacity: 0.4 }}
            className="text-black dark:text-white"
          >
            {isMobile ? "tap to dismiss" : "click to dismiss"}
          </p>
        </div>
      </motion.div>
    </>
  );
}
// ─── Hook for managing bubble state ───
export function useInfoBubble() {
  const [isBubbleOpen, setIsBubbleOpen] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [popRequested, setPopRequested] = useState(false);
  const [vaporOrigin, setVaporOrigin] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const handlePop = useCallback(
    (x: number, y: number, w: number, h: number) => {
      setIsBubbleOpen(false);
      setPopRequested(false);
      // Defer vapor cloud to next frame so bubble exit doesn't compete
      requestAnimationFrame(() => {
        setVaporOrigin({ x, y, w, h });
      });
    },
    [],
  );

  const handleVaporDone = useCallback(() => {
    setVaporOrigin(null);
  }, []);

  const openBubble = useCallback(() => {
    setIsBubbleOpen(true);
  }, []);

  const requestPop = useCallback(() => {
    setPopRequested(true);
  }, []);

  // Delayed version: delays the rising edge so the box fades in after the bubble
  const [isBubbleVisibleDelayed, setIsBubbleVisibleDelayed] = useState(false);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBubbleVisibility = useCallback((inView: boolean) => {
    setIsBubbleVisible(inView);
    if (delayTimer.current) clearTimeout(delayTimer.current);
    if (inView) {
      // Delay the rising edge so box fades in after bubble

      setIsBubbleVisibleDelayed(true);
    } else {
      // No delay on fade-out — they fade together
      setIsBubbleVisibleDelayed(false);
    }
  }, []);

  return {
    isBubbleOpen,
    isBubbleVisible,
    isBubbleVisibleDelayed,
    popRequested,
    vaporOrigin,
    handlePop,
    handleVaporDone,
    openBubble,
    requestPop,
    handleBubbleVisibility,
  };
}
