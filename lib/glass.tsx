"use client";

import { useState, useEffect } from "react";

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

export function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    setIsDark(el.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(el.classList.contains("dark"));
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

// ─── Glass Style (inline) ───────────────────────────────────────────────────
// Blur and saturation now come from .glass-panel / .glass-pill in globals.css.
// Kept as an object so existing call sites can keep spreading it.

export const glassStyle: React.CSSProperties = {};

// ─── FuzzyText ──────────────────────────────────────────────────────────────

export const FuzzyText = ({
  children,
  style = {},
  className = "",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) => (
  // Used to sit a 12px-blurred halo behind every run of text; the panels are
  // opaque enough now that it only cost paint time, so it's a plain span.
  <span style={{ position: "relative", display: "inline-block", ...style }} className={className}>
    {children}
  </span>
);

// ─── GlassLayers ────────────────────────────────────────────────────────────
// Decorates a .glass-panel: a hairline satin-metal rim, a specular line along
// the top edge, and a faint brushed sheen that catches light from the upper left.

export function GlassLayers({
  refractionSide = "left",
  specularInset = "8%",
}: {
  refractionSide?: "left" | "right";
  specularInset?: string;
} = {}) {
  const lightX = refractionSide === "left" ? "18%" : "82%";
  return (
    <>
      {/* the rim sits in a mask the liquid swells can open (.ring-mask) */}
      <div className="ring-mask" style={{ zIndex: 0 }}>
        <div className="metal-ring" />
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: specularInset,
          right: specularInset,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.9) 30%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 70%, transparent)",
          opacity: 0.55,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 0,
          background: `radial-gradient(90% 60% at ${lightX} 0%, rgba(255,255,255,0.18), transparent 60%)`,
        }}
      />
    </>
  );
}
