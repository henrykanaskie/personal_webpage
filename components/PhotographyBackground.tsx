"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useIsDark } from "@/hooks/useIsDark";
import { photo } from "@/lib/tokens";

/**
 * Persistent photography background that lives OUTSIDE PageTransition.
 * Prevents the body's grid background from showing through during
 * route transitions between photography pages.
 */
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.4 -0.2"/></filter><rect width="180" height="180" filter="url(#n)"/></svg>',
)}")`;

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
  // Tied to isPhoto (not visible) so styles are restored immediately on
  // navigation away: the overlay div fades out independently, preventing a
  // flash of the photography color on the transparent CS side of the home page.
  useEffect(() => {
    const bgColor = isDark ? photo.background.dark : photo.background.light;
    if (isPhoto) {
      document.documentElement.style.backgroundColor = bgColor;
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = bgColor;
    } else {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundImage = "";
      document.body.style.backgroundColor = "";
    }
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundImage = "";
      document.body.style.backgroundColor = "";
    };
  }, [isPhoto, isDark]);

  if (!visible) return null;

  return (
    <>
      {/* Solid background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: isDark ? photo.background.dark : photo.background.light,
          zIndex: 0,
          pointerEvents: "none",
          transition: "opacity 0.4s ease-out",
          opacity: isPhoto ? 1 : 0,
        }}
      />

      {/* Film grain: a small noise tile rendered once as an image and repeated, instead of a live full-screen SVG filter */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: GRAIN,
          backgroundSize: "180px 180px",
          opacity: isPhoto ? (isDark ? 0.07 : 0.05) : 0,
          zIndex: 0,
          transition: "opacity 0.4s ease-out",
        }}
      />
    </>
  );
}
