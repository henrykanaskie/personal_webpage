"use client";

import { useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";

// ─── Shared glass styling ───
export const glassStyle: React.CSSProperties = {
  backdropFilter: "blur(2px) saturate(1.05)",
  WebkitBackdropFilter: "blur(2px) saturate(1.05)",
};

export const glassClassNames = `
  bg-transparent
  border border-[rgba(255,255,255,0.03)]
  border-t-[rgba(255,255,255,0.001)]
  border-r-[rgba(255,255,255,0.004)]
  shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]
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
    const { x: startX, y: startY } = sampleRoundedRectBorder(
      halfW,
      halfH,
      borderRadius,
    );

    // Mostly radial outward from center, but with significant angular spread
    const baseAngle = Math.atan2(startY, startX);
    const scatter = (Math.random() - 0.5) * Math.PI * 1.2; // ±108° spread
    const angle = baseAngle + scatter;
    const dist = Math.random() * 25 + 15;

    return {
      id: i,
      startX,
      startY,
      endX: startX + Math.cos(angle) * dist,
      endY: startY + Math.sin(angle) * dist,
      size: Math.random() * 2 + 0.5,
      rotation: (Math.random() - 0.5) * 360,
      delay: Math.random() * 0.15,
      duration: Math.random() * 0.35 + 0.25,
      initialOpacity: Math.random() * 0.3 + 0.4,
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
  const [particles] = useState(() =>
    generateBorderParticles(300, bubbleWidth, bubbleHeight),
  );
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
        zIndex: 9999,
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
            ease: [0.22, 0.1, 0.36, 1],
          }}
          onAnimationComplete={handleDone}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(200,220,255,0.3) 50%, transparent 100%)",
            boxShadow: "0 0 4px rgba(255,255,255,0.2)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Mitosis Bubble ───
// `side`: "right" means bubble pops out to the right (for LeftInfoBox)
//         "left"  means bubble pops out to the left  (for RightInfoBox)
const BUBBLE_REST_OFFSET = 260; // px away from parent side edge

export function MitosisBubble({
  extraInfo,
  side,
  onPop,
}: {
  extraInfo: string;
  side: "left" | "right";
  onPop: (x: number, y: number, w: number, h: number) => void;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [isPopping, setIsPopping] = useState(false);
  const isRight = side === "right";

  const handleClick = () => {
    if (isPopping) return;
    setIsPopping(true);
    // Brief expand, then pop
    setTimeout(() => {
      if (!bubbleRef.current) return;
      const rect = bubbleRef.current.getBoundingClientRect();
      onPop(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        rect.width,
        rect.height,
      );
    }, 80);
  };

  // Horizontal positioning: anchored to the appropriate side edge
  const sideAnchor = isRight ? { right: 0 } : { left: 0 };

  // Bridge connects from parent side edge outward
  const bridgeStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transformOrigin: isRight ? "left center" : "right center",
    pointerEvents: "none",
    zIndex: 2,
    ...glassStyle,
    ...(isRight ? { right: 0 } : { left: 0 }),
  };

  return (
    <>
      {/* ── Connecting bridge (horizontal neck) ── */}
      <motion.div
        style={bridgeStyle}
        initial={{
          width: 0,
          height: 70,
          y: "-50%",
          x: isRight ? "100%" : "-0%",
          opacity: 1,
          borderRadius: isRight ? "0 35px 35px 0" : "35px 0 0 35px",
        }}
        animate={{
          width: [0, 40, 80, 80, 0],
          height: [70, 55, 35, 12, 0],
          opacity: [1, 1, 1, 0.5, 0],
          borderRadius: isRight
            ? [
                "0 35px 35px 0",
                "0 28px 28px 0",
                "0 18px 18px 0",
                "0 6px 6px 0",
                "0 0 0 0",
              ]
            : [
                "35px 0 0 35px",
                "28px 0 0 28px",
                "18px 0 0 18px",
                "6px 0 0 6px",
                "0 0 0 0",
              ],
        }}
        transition={{
          duration: 0.85,
          times: [0, 0.2, 0.5, 0.8, 1],
          ease: "easeInOut",
        }}
      />

      {/* ── The bubble itself ── */}
      <motion.div
        ref={bubbleRef}
        onClick={handleClick}
        style={{
          position: "absolute",
          top: "50%",
          ...sideAnchor,
          width: 220,
          padding: "20px 24px",
          borderRadius: "24px",
          cursor: "pointer",
          pointerEvents: "auto",
          transformOrigin: isRight ? "left center" : "right center",
          zIndex: 3,
          ...glassStyle,
        }}
        className={glassClassNames}
        initial={{
          y: "-50%",
          x: isRight ? "30%" : "-30%",
          scaleX: 0.15,
          scaleY: 0.3,
          opacity: 0,
        }}
        animate={{
          y: "-50%",
          x: isRight
            ? `calc(100% + ${BUBBLE_REST_OFFSET - 200}px)`
            : `calc(-100% - ${BUBBLE_REST_OFFSET - 200}px)`,
          scaleX: isPopping ? 1.12 : 1,
          scaleY: isPopping ? 1.12 : 1,
          opacity: 1,
        }}
        transition={
          isPopping
            ? {
                scale: { duration: 0.08, ease: "easeOut" },
              }
            : {
                duration: 0.75,
                ease: [0.34, 1.56, 0.64, 1],
                opacity: { duration: 0.3, ease: "easeOut" },
              }
        }
        exit={{
          opacity: 0,
          transition: { duration: 0.001 },
        }}
        whileHover={
          isPopping ? {} : { scale: 1.03, transition: { duration: 0.2 } }
        }
      >
        {/* Specular highlight on bubble */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 70%, transparent)",
            borderRadius: "inherit",
            pointerEvents: "none",
          }}
        />

        {/* Chromatic aberration on bubble */}
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

        {/* Content — pointerEvents none so clicks pass through to the bubble div */}
        <div style={{ position: "relative", zIndex: 1, pointerEvents: "none" }}>
          <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.6 }}>
            <span className="text-black dark:text-gray-200">{extraInfo}</span>
          </p>
          <p
            style={{
              margin: 0,
              marginTop: 12,
              fontSize: "10px",
              textAlign: "center",
              opacity: 0.4,
            }}
            className="text-black dark:text-white"
          >
            click to dismiss
          </p>
        </div>
      </motion.div>
    </>
  );
}

// ─── Hook for managing bubble state ───
export function useMitosisBubble() {
  const [isBubbleOpen, setIsBubbleOpen] = useState(false);
  const [vaporOrigin, setVaporOrigin] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const handlePop = useCallback(
    (x: number, y: number, w: number, h: number) => {
      setIsBubbleOpen(false);
      setVaporOrigin({ x, y, w, h });
    },
    [],
  );

  const handleVaporDone = useCallback(() => {
    setVaporOrigin(null);
  }, []);

  const toggleBubble = useCallback(() => {
    setIsBubbleOpen((prev) => !prev);
  }, []);

  return {
    isBubbleOpen,
    vaporOrigin,
    handlePop,
    handleVaporDone,
    toggleBubble,
  };
}
