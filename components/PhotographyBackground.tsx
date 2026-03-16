"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useIsDark } from "@/components/InfoBubble";

/**
 * Persistent photography background that lives OUTSIDE PageTransition.
 * Prevents the body's grid background from showing through during
 * route transitions between photography pages.
 */
export default function PhotographyBackground() {
  const pathname = usePathname();
  const isDark = useIsDark();
  const isPhoto = pathname?.startsWith("/photography") ?? false;
  const [visible, setVisible] = useState(isPhoto);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (isPhoto) {
      clearTimeout(timerRef.current);
      setVisible(true);
    } else {
      // Keep showing for a bit after leaving photography to cover exit animation
      timerRef.current = setTimeout(() => setVisible(false), 800);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPhoto]);

  // Suppress the body's grid background on photography pages so it can't
  // bleed through at the bottom on mobile (avoids z-index/stacking issues).
  useEffect(() => {
    if (visible) {
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "transparent";
    } else {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundColor = "";
    }
    return () => {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundColor = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {/* Solid background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: isDark ? "#050507" : "#f8f5f0",
          zIndex: 0,
          pointerEvents: "none",
          transition: "opacity 0.4s ease-out",
          opacity: isPhoto ? 1 : 0,
        }}
      />

      {/* Film grain overlay */}
      <svg
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: isDark ? 0.042 : 0.032,
          mixBlendMode: "overlay",
          zIndex: 0,
          transition: "opacity 0.4s ease-out",
        }}
      >
        <defs>
          <filter id="persistent-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="4"
              stitchTiles="stitch"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#persistent-grain)" />
      </svg>
    </>
  );
}
