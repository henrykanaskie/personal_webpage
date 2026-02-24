"use client";

import { useRef, useCallback, useState } from "react";
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
  InfoBubble,
  VaporCloud,
  useInfoBubble,
  useIsMobile,
  type BubbleInfo,
} from "./InfoBubble";

interface RightInfoBoxProps {
  title: string;
  company: string;
  role: string;
  description: string;
  svgPaths: string[];
  svgSize?: number;
  svgDrawDuration?: number;
  extraInfo?: BubbleInfo;
  svgRotate?: number;
  svgFlipX?: boolean;
  svgFlipY?: boolean;
  svgOffset?: { x?: number; y?: number };
}
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
// Helper component for fuzzy text background
const FuzzyText = ({
  children,
  style = {},
  className = "",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) => {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        zIndex: 1,
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: "-10px",
          zIndex: -1,
          filter: "blur(12px)",
          borderRadius: "15px",
          transform: "translateZ(0)",
        }}
        className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(29,29,29,0.5)]"
      />
      <span style={{ position: "relative", zIndex: 1 }} className={className}>
        {children}
      </span>
    </span>
  );
};

export default function RightInfoBox({
  title,
  company,
  role,
  description,
  svgPaths,
  svgSize = 80,
  svgDrawDuration = 3,
  extraInfo,
  svgRotate = 0,
  svgFlipX = false,
  svgFlipY = false,
  svgOffset = { x: 0, y: 0 },
}: RightInfoBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(boxRef, { once: false, amount: 0.1 });
  const isMobile = useIsMobile();
  const {
    isBubbleOpen,
    popRequested,
    vaporOrigin,
    handlePop,
    handleVaporDone,
    openBubble,
    requestPop,
  } = useInfoBubble();

  // SVG draw progress
  const svgProgress = useMotionValue(0);
  const drawTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onViewportEnter = useCallback(() => {
    if (drawTimer.current) clearTimeout(drawTimer.current);
    drawTimer.current = setTimeout(() => {
      animate(svgProgress, 1, { duration: svgDrawDuration, ease: "easeInOut" });
      drawTimer.current = null;
    }, 600);
  }, [svgProgress, svgDrawDuration]);

  const onViewportLeave = useCallback(() => {
    if (drawTimer.current) clearTimeout(drawTimer.current);
    drawTimer.current = null;
    animate(svgProgress, 0, { duration: 1.8, ease: "easeInOut" });
  }, [svgProgress]);

  return (
    <>
      {/* Vapor particles rendered at document level (fixed positioning) */}
      {vaporOrigin && (
        <VaporCloud
          originX={vaporOrigin.x}
          originY={vaporOrigin.y}
          bubbleWidth={vaporOrigin.w}
          bubbleHeight={vaporOrigin.h}
          onComplete={handleVaporDone}
        />
      )}

      <motion.div
        ref={boxRef}
        initial={{ x: 0, y: 15 }}
        animate={isInView ? { x: 0, y: 0 } : isMobile ? { x: 0, y: 15 } : { x: 20, y: 10 }}
        onViewportEnter={onViewportEnter}
        onViewportLeave={onViewportLeave}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
        }}
        style={{
          position: "relative",
          maxWidth: "clamp(320px, 55vw, 780px)",
          minHeight: "clamp(200px, 22vw, 300px)",
          zIndex: isBubbleOpen ? 10 : "auto",
        }}
        className="mx-auto md:mx-0 md:self-end md:mr-[5%] w-[calc(100%-2rem)] md:w-auto"
      >
        {/* SVG positioned outside the glass box so backdrop-filter blurs it */}
        <motion.div
          className="hidden md:block"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: `${35 + (svgOffset.y ?? 0)}px`,
            left: `${25 + (svgOffset.x ?? 0)}px`,
            transformOrigin: "top left",
            transform:
              `${svgFlipX ? "scaleX(-1)" : ""} ${svgFlipY ? "scaleY(-1)" : ""}`.trim() ||
              undefined,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <AnimatedSvg
            paths={svgPaths}
            size={svgSize}
            strokeWidth={0.8}
            scrollProgress={svgProgress}
            rotate={svgRotate}
          />
        </motion.div>

        {/* Glass box */}
        <motion.div
          transition={{ duration: 1.8, ease: "easeInOut" }}
          style={{
            opacity: 1,
            position: "relative",
            borderRadius: "24px",
            ...glassStyle,
          }}
          className={`${glassClassNames} p-5 md:p-10 lg:p-12`}
        >
          {/* Specular highlight — top edge caustic */}
          <div
            className="dark:hidden"
            style={{
              position: "absolute",
              top: 0,
              left: "10%",
              right: "10%",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 70%, transparent)",
              borderRadius: "inherit",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          <div
            className="hidden dark:block"
            style={{
              position: "absolute",
              top: 0,
              left: "10%",
              right: "10%",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 70%, transparent)",
              borderRadius: "inherit",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          {/* Bottom specular highlight */}
          <div
            className="dark:hidden"
            style={{
              position: "absolute",
              bottom: 0,
              left: "10%",
              right: "10%",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.04) 70%, transparent)",
              borderRadius: "inherit",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          <div
            className="hidden dark:block"
            style={{
              position: "absolute",
              bottom: 0,
              left: "10%",
              right: "10%",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.2) 70%, transparent)",
              borderRadius: "inherit",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          {/* Chromatic aberration edge glow */}
          <div
            style={{
              position: "absolute",
              top: -1,
              left: -1,
              right: -1,
              bottom: -1,
              borderRadius: "inherit",
              pointerEvents: "none",
              zIndex: 0,
              boxShadow:
                "inset 2px 0 8px rgba(255,0,80,0.04), inset -2px 0 8px rgba(0,100,255,0.04), inset 0 2px 8px rgba(255,200,0,0.03), inset 0 -2px 8px rgba(0,200,255,0.03)",
            }}
          />

          {/* Internal refraction gradient */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: "inherit",
              pointerEvents: "none",
              zIndex: 0,
              background:
                "radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.02) 0%, transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(200,220,255,0.05) 0%, transparent 50%)",
            }}
          />

          {/* Edge distortion — heavier blur at edges */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
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

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: "8px",
                fontSize: "clamp(1.375rem, 2.2vw, 1.875rem)",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              <FuzzyText>
                <span
                  className="bg-clip-text text-transparent dark:hidden"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: `linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)`,
                  }}
                >
                  {title}
                </span>
                <span
                  className="bg-clip-text text-transparent hidden dark:inline"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: `linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)`,
                  }}
                >
                  {title}
                </span>
              </FuzzyText>
            </h2>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "4px",
                fontSize: "clamp(1.0625rem, 1.6vw, 1.375rem)",
                textAlign: "center",
              }}
            >
              <FuzzyText className="text-black dark:text-gray-200">
                {company}
              </FuzzyText>
            </h3>
            <h4
              style={{
                marginTop: 0,
                marginBottom: "16px",
                fontSize: "clamp(0.9375rem, 1.4vw, 1.25rem)",
                textAlign: "center",
              }}
            >
              <FuzzyText className="text-[#555] dark:text-gray-300">
                {role}
              </FuzzyText>
            </h4>
            <p
              style={{
                marginTop: 0,
                marginBottom: 0,
                fontSize: "clamp(0.875rem, 1.2vw, 1.125rem)",
              }}
            >
              <FuzzyText className="text-black dark:text-white">
                {description}
              </FuzzyText>
            </p>

            {/* Toggle Button */}
            {extraInfo && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={isBubbleOpen ? requestPop : openBubble}
                  className="
                  group relative px-4 py-2 rounded-full text-sm font-medium
                  text-black dark:text-white
                  bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10
                  border border-white/10 transition-all duration-300
                "
                >
                  <span className="relative z-10">
                    {isBubbleOpen ? "Close" : "More Info"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Info Bubble — pops out to the LEFT ── */}
        <motion.div
          initial={isMobile ? { opacity: 0 } : undefined}
          animate={isMobile ? (isInView ? { opacity: 1 } : { opacity: 0 }) : undefined}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          style={{
            ...(!isMobile && { opacity: 1 }),
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
            {isBubbleOpen && extraInfo && (
              <InfoBubble
                extraInfo={extraInfo}
                side="left"
                onPop={handlePop}
                isMobile={isMobile}
                popRequested={popRequested}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Mobile spacer — pushes content below when bubble is open */}
      {isMobile && (
        <motion.div
          animate={{ height: isBubbleOpen ? 320 : 0 }}
          transition={{ duration: 0.75, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ height: 0, overflow: "hidden" }}
        />
      )}
    </>
  );
}
