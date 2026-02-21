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
} from "./InfoBubble";

interface RightInfoBoxProps {
  title: string;
  company: string;
  role: string;
  description: string;
  svgPaths: string[];
  extraInfo?: string;
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
          willChange: "filter",
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
  extraInfo,
}: RightInfoBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(boxRef, { once: false, amount: 0.1 });
  const isMobile = useIsMobile();
  const {
    isBubbleOpen,
    vaporOrigin,
    handlePop,
    handleVaporDone,
    toggleBubble,
  } = useInfoBubble();

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
        initial={{ opacity: 0, x: 20, y: 10 }}
        animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: 20, y: 10 }}
        onViewportEnter={onViewportEnter}
        onViewportLeave={onViewportLeave}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
        }}
        style={{
          position: "relative",
          borderRadius: "24px",
          ...glassStyle,
        }}
        className={`${glassClassNames} p-5 md:p-8 max-w-[650px] min-h-[200px] md:min-h-[250px] mx-auto md:mx-0 md:self-end md:mr-[5%] w-[calc(100%-2rem)] md:w-auto`}
      >
        {/* Specular highlight — top edge caustic */}
        <div
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

        {/* SVG positioned on the opposite side from alignment — hidden on mobile */}
        <div
          className="hidden md:block"
          style={{
            position: "absolute",
            top: "35px",
            left: "25px",
            transformOrigin: "top left",
            pointerEvents: "auto",
            zIndex: 1,
          }}
        >
          <AnimatedSvg
            paths={svgPaths}
            size={80}
            strokeWidth={0.8}
            scrollProgress={svgProgress}
          />
        </div>

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2
            style={{
              marginTop: 0,
              marginBottom: "8px",
              fontSize: "24px",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            <FuzzyText>
              <span
                className="bg-clip-text text-transparent dark:hidden"
                style={{
                  WebkitBackgroundClip: "text",
                  backgroundImage: `linear-gradient(135deg, rgba(10,10,20,0.55) 0%, rgba(25,15,35,0.5) 15%, rgba(10,20,30,0.53) 30%, rgba(30,15,25,0.48) 45%, rgba(10,20,28,0.52) 60%, rgba(22,12,32,0.5) 75%, rgba(12,18,30,0.53) 90%, rgba(28,15,28,0.5) 100%)`,
                }}
              >
                {title}
              </span>
              <span
                className="bg-clip-text text-transparent hidden dark:inline"
                style={{
                  WebkitBackgroundClip: "text",
                  backgroundImage: `linear-gradient(135deg, rgba(220,225,255,0.55) 0%, rgba(240,220,250,0.48) 15%, rgba(220,235,255,0.52) 30%, rgba(245,225,240,0.46) 45%, rgba(215,230,250,0.5) 60%, rgba(235,220,248,0.48) 75%, rgba(220,228,252,0.52) 90%, rgba(240,222,245,0.48) 100%)`,
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
              fontSize: "18px",
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
              fontSize: "16px",
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
              fontSize: "14px",
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
                onClick={toggleBubble}
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

        {/* ── Info Bubble — pops out to the LEFT ── */}
        <div
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
            {isBubbleOpen && extraInfo && (
              <InfoBubble extraInfo={extraInfo} side="left" onPop={handlePop} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Mobile spacer — pushes content below when bubble is open */}
      {isMobile && (
        <motion.div
          animate={{ height: isBubbleOpen ? 80 : 0 }}
          transition={{ duration: 0.75, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ height: 0, overflow: "hidden" }}
        />
      )}
    </>
  );
}
