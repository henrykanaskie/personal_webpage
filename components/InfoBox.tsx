"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInViewFromBelow } from "@/hooks/useInViewFromBelow";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useDrawOnView } from "@/hooks/useDrawOnView";
import AnimatedSvg from "./AnimatedSvg";
import CardHeader from "./CardHeader";
import { InfoBubble, VaporCloud, BubbleLayer, useInfoBubble, type BubbleInfo } from "./InfoBubble";
import { GlassCard } from "@/lib/glass";
import { rise, settle, leave } from "@/lib/motion";

export interface InfoBoxProps {
  side: "left" | "right";
  title: string;
  company: string;
  role: string;
  description: string;
  svgPaths: string[];
  svgSize?: number;
  svgDrawDuration?: number;
  extraInfo?: BubbleInfo;
  svgRotate?: number;
  svgOffset?: { x?: number; y?: number };
}

/** An experience entry: a glass card with a line drawing beside it and, when
    there is `extraInfo`, a "More Info" bubble that buds off its far side. */
export default function InfoBox({
  side,
  title,
  company,
  role,
  description,
  svgPaths,
  svgSize = 80,
  svgDrawDuration = 3,
  extraInfo,
  svgRotate = 0,
  svgOffset = { x: 0, y: 0 },
}: InfoBoxProps) {
  const isLeft = side === "left";
  const boxRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile(1000);
  const isInView = useInViewFromBelow(boxRef, isMobile ? 0.15 : 0.1);
  const bubble = useInfoBubble();
  const { drawn, onViewportEnter, onViewportLeave } = useDrawOnView();

  // The bubble is part of the box's resting composition, but it only buds off
  // once the box has been seen and has mostly settled, so the separation is
  // something you actually watch rather than something that happened off screen.
  const [budReady, setBudReady] = useState(false);
  useEffect(() => {
    if (!isInView || budReady) return;
    const t = setTimeout(() => setBudReady(true), 450);
    return () => clearTimeout(t);
  }, [isInView, budReady]);

  return (
    <>
      {bubble.vaporOrigin && <VaporCloud origin={bubble.vaporOrigin} onComplete={bubble.handleVaporDone} />}

      <motion.div
        ref={boxRef}
        initial={rise.hidden}
        animate={isInView ? rise.shown : rise.hidden}
        exit={leave}
        onViewportEnter={onViewportEnter}
        onViewportLeave={onViewportLeave}
        transition={settle}
        style={{
          position: "relative",
          maxWidth: "clamp(320px, 55vw, 780px)",
          minHeight: "clamp(200px, 22vw, 300px)",
          zIndex: "auto",
        }}
        className={`mx-auto md:mx-0 ${isLeft ? "md:ml-[5%]" : "md:self-end md:mr-[5%]"} w-[calc(100%-2rem)] md:w-auto`}
      >
        {/* The drawing sits outside the glass, behind the card's outer edge */}
        <motion.div
          className="hidden md:block"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: `${35 + (svgOffset.y ?? 0)}px`,
            [isLeft ? "right" : "left"]: `${(isLeft ? -25 : 25) + (svgOffset.x ?? 0)}px`,
            transformOrigin: isLeft ? "top right" : "top left",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <AnimatedSvg paths={svgPaths} size={svgSize} drawn={drawn} rotate={svgRotate} duration={svgDrawDuration} />
        </motion.div>

        <GlassCard refractionSide={isLeft ? "left" : "right"} className="p-5 md:p-10 lg:p-12">
          <CardHeader title={title} subtitle={company} meta={role} />
          <p
            className="font-[family-name:var(--font-elevated)]"
            style={{
              marginTop: 0,
              marginBottom: 0,
              fontSize: "clamp(0.875rem, 1.2vw, 1.125rem)",
              fontWeight: 400,
              letterSpacing: "-0.005em",
              lineHeight: 1.7,
              color: "var(--body-ink)",
            }}
          >
            <span className="relative inline-block">{description}</span>
          </p>

          {extraInfo && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={bubble.isBubbleOpen ? bubble.requestPop : bubble.openBubble}
                className="metal-surface group relative px-4 py-2 rounded-full text-sm font-semibold hover:-translate-y-px"
              >
                <span className="relative z-10">{bubble.isBubbleOpen ? "Close" : "More Info"}</span>
              </button>
            </div>
          )}
        </GlassCard>

        <BubbleLayer>
          <AnimatePresence>
            {bubble.isBubbleOpen && extraInfo && budReady && (
              <InfoBubble
                extraInfo={extraInfo}
                side={isLeft ? "right" : "left"}
                onPop={bubble.handlePop}
                isMobile={isMobile}
                popRequested={bubble.popRequested}
                parentInView={isInView}
              />
            )}
          </AnimatePresence>
        </BubbleLayer>
      </motion.div>

      {/* Mobile spacer: only needed for absolute-positioned mobile bubble */}
      {isMobile && (
        <motion.div
          animate={{ height: bubble.isBubbleOpen ? 340 : 0 }}
          transition={
            bubble.isBubbleOpen
              ? { duration: 0.6, ease: [0.25, 1, 0.5, 1] }
              : { duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }
          }
          style={{ height: 0, overflow: "hidden" }}
        />
      )}
    </>
  );
}
