"use client";

import { useIsDark } from "@/components/InfoBubble";

export default function PhotographyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDark = useIsDark();

  return (
    <div className="-mx-3" style={{ minHeight: "100vh", position: "relative" }}>
      {/* Shared fixed background — persists across photography page transitions */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: isDark ? "#050507" : "#f8f5f0",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Shared film grain overlay */}
      <svg
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: isDark ? 0.042 : 0.032,
          mixBlendMode: "overlay",
          zIndex: 1,
        }}
      >
        <defs>
          <filter id="photo-layout-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="4"
              stitchTiles="stitch"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#photo-layout-grain)" />
      </svg>

      {/* Page content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          // Reserve space for the fixed top photography nav
          paddingTop: "calc(env(safe-area-inset-top) + 72px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
