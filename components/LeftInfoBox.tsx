"use client";

import { useRef, useCallback } from "react";
import {
  motion,
  useMotionValue,
  animate,
  AnimatePresence,
} from "framer-motion";
import AnimatedSvg from "./AnimatedSvg";
import {
  glassStyle,
  glassClassNames,
  MitosisBubble,
  VaporCloud,
  useMitosisBubble,
} from "./MitosisBubble";

interface LeftInfoBoxProps {
  title: string;
  company: string;
  role: string;
  description: string;
  svgPaths: string[];
  extraInfo?: string;
}

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
        }}
        className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(29,29,29,0.5)]"
      />
      <span style={{ position: "relative", zIndex: 1 }} className={className}>
        {children}
      </span>
    </span>
  );
};

export default function LeftInfoBox({
  title,
  company,
  role,
  description,
  svgPaths,
  extraInfo,
}: LeftInfoBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const {
    isBubbleOpen,
    vaporOrigin,
    handlePop,
    handleVaporDone,
    toggleBubble,
  } = useMitosisBubble();

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
        initial={{ opacity: 0, x: -20, y: 10 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        onViewportEnter={onViewportEnter}
        onViewportLeave={onViewportLeave}
        viewport={{
          once: false,
          amount: 0.15,
          margin: "-100px 0px -100px 0px",
        }}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
        }}
        style={{
          position: "relative",
          borderRadius: "24px",
          padding: "32px",
          maxWidth: "650px",
          minHeight: "250px",
          marginLeft: "5%",
          ...glassStyle,
        }}
        className={glassClassNames}
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
            zIndex: 2,
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
              "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.02) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200,220,255,0.05) 0%, transparent 50%)",
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

        {/* SVG positioned in the top right corner */}
        <div
          style={{
            position: "absolute",
            top: "-250px",
            right: "-250px",
            transformOrigin: "top right",
            pointerEvents: "auto",
            zIndex: 1,
          }}
        >
          <AnimatedSvg
            paths={svgPaths}
            size={600}
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
              textAlign: "center",
            }}
          >
            <FuzzyText className="text-black dark:text-white">
              {title}
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

        {/* ── Mitosis Bubble — pops out to the RIGHT ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          <AnimatePresence>
            {isBubbleOpen && extraInfo && (
              <MitosisBubble
                extraInfo={extraInfo}
                side="right"
                onPop={handlePop}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
