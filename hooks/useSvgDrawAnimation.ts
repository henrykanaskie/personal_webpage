"use client";

import { useRef, useEffect, useCallback } from "react";
import { useMotionValue, useIsPresent, animate } from "framer-motion";

export function useSvgDrawAnimation(svgDrawDuration: number) {
  const svgProgress = useMotionValue(0);
  const drawTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPresent = useIsPresent();
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

  return { svgProgress, onViewportEnter, onViewportLeave };
}
