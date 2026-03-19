"use client";

import { useRef, useCallback, useEffect } from "react";
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
  InfoBubble,
  VaporCloud,
  useInfoBubble,
  type BubbleInfo,
} from "./InfoBubble";
import { glassStyle, GlassLayers, FuzzyText, useIsMobile, useIsDark } from "../lib/glass";
import { glassBoxClassNames, cs, themed } from "../lib/tokens";

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
  const isMobile = useIsMobile(1000);
  const isDark = useIsDark();
  const isInView = useInView(boxRef, {
    once: false,
    amount: isMobile ? 0.15 : 0.1,
  });
  const {
    isBubbleOpen,
    popRequested,
    vaporOrigin,
    handlePop,
    handleVaporDone,
    openBubble,
    requestPop,
    handleBubbleVisibility,
  } = useInfoBubble();

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
        initial={{ x: "70vw" }}
        animate={
          isInView
            ? { x: 0, y: 0 }
            : isMobile
              ? { x: 0, y: 15 }
              : { x: 20, y: 10 }
        }
        exit={{
          x: "70vw",
          transition: { duration: 0.55, ease: [0.5, 0, 0.75, 0] },
        }}
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
          zIndex: "auto",
        }}
        className="mx-auto md:mx-0 md:self-end md:mr-[5%] w-[calc(100%-2rem)] md:w-auto"
      >
        {/* SVG positioned outside the glass box so backdrop-filter blurs it */}
        <motion.div
          className="hidden md:block"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
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
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          style={{
            position: "relative",
            borderRadius: "24px",
            ...glassStyle,
          }}
          className={`${glassBoxClassNames} p-5 md:p-10 lg:p-12`}
        >
          <GlassLayers refractionSide="right" />

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
            <h3
              className="font-[family-name:var(--font-elevated)]"
              style={{
                marginTop: 0,
                marginBottom: "4px",
                fontSize: "clamp(1.0625rem, 1.6vw, 1.375rem)",
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: "-0.01em",
              }}
            >
              <FuzzyText>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: themed(isDark, cs.body.dark, cs.body.light),
                  }}
                >
                  {company}
                </span>
              </FuzzyText>
            </h3>
            <h4
              className="font-[family-name:var(--font-elevated)]"
              style={{
                marginTop: 0,
                marginBottom: "16px",
                fontSize: "clamp(0.9375rem, 1.4vw, 1.25rem)",
                fontWeight: 700,
                textAlign: "center",
                letterSpacing: "-0.01em",
              }}
            >
              <FuzzyText>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: themed(isDark, cs.body.dark, cs.body.light),
                  }}
                >
                  {role}
                </span>
              </FuzzyText>
            </h4>
            <p
              className="font-[family-name:var(--font-elevated)]"
              style={{
                marginTop: 0,
                marginBottom: 0,
                fontSize: "clamp(0.875rem, 1.2vw, 1.125rem)",
                fontWeight: 700,
                letterSpacing: "-0.005em",
                lineHeight: 1.6,
              }}
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

            {/* Toggle Button */}
            {extraInfo && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={isBubbleOpen ? requestPop : openBubble}
                  className="
                  group relative px-4 py-2 rounded-full text-sm font-medium
                  text-black dark:text-white
                  bg-blue-500/3 hover:bg-blue-500/5 dark:bg-white/5 dark:hover:bg-white/10
                  border border-[rgba(100,130,200,0.2)]
                  dark:border-[rgba(255,255,255,0.05)] transition-all duration-300
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

        {/* ── Info Bubble ── */}
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
            {isBubbleOpen && extraInfo && (
              <InfoBubble
                extraInfo={extraInfo}
                side="left"
                onPop={handlePop}
                isMobile={isMobile}
                popRequested={popRequested}
                onVisibilityChange={handleBubbleVisibility}
                parentInView={isInView}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Mobile spacer — only needed for absolute-positioned mobile bubble */}
      {isMobile && (
        <motion.div
          animate={{ height: isBubbleOpen ? 340 : 0 }}
          transition={
            isBubbleOpen
              ? { duration: 0.6, ease: [0.25, 1, 0.5, 1] }
              : { duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }
          }
          style={{ height: 0, overflow: "hidden" }}
        />
      )}
    </>
  );
}
