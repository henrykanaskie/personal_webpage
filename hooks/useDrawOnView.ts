"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Starts a line drawing a beat after its element comes into view. Leaving the
 * view before then cancels it; once drawn it stays drawn (see AnimatedSvg).
 * Wire the returned handlers to a motion element's onViewportEnter/Leave.
 */
export function useDrawOnView(delayMs = 600) {
  const [drawn, setDrawn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const onViewportEnter = useCallback(() => {
    cancel();
    timer.current = setTimeout(() => {
      timer.current = null;
      setDrawn(true);
    }, delayMs);
  }, [cancel, delayMs]);

  useEffect(() => cancel, [cancel]);

  return { drawn, onViewportEnter, onViewportLeave: cancel };
}
