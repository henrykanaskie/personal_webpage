"use client";

import { useEffect, useState, RefObject } from "react";
import { useInView } from "framer-motion";

/**
 * Direction-aware visibility:
 * - Fades IN when element enters viewport from below (scrolling down)
 * - Stays visible when element leaves through the top (scrolled past going down)
 * - Resets to invisible when element leaves through the bottom (scrolled back up past it)
 * - Fades in again next time user scrolls down to it
 */
export function useInViewFromBelow(
  ref: RefObject<Element | null>,
  amount: number
): boolean {
  const framerInView = useInView(ref, { amount, once: false });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (framerInView) {
      setVisible(true);
    } else {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // rect.top > 0 means element is below the viewport (user scrolled UP past it)
      // → reset so it fades in again next scroll down
      // rect.top <= 0 means element is above the viewport (user scrolled DOWN past it)
      // → keep visible
      if (rect.top > 0) {
        setVisible(false);
      }
    }
  }, [framerInView, ref]);

  return visible;
}
