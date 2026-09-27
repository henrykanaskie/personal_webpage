"use client";

import { useState, useEffect } from "react";
import { CardLens } from "./liquid";

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
// Decorates a .glass-panel: the glass edge (the same lip and thin film as the
// bubbles, .edge-ring), a specular line along the top edge, and the bubbles'
// lens along the rim (CardLens). No sheen: the bubbles have none.

export function GlassLayers({
  specularInset = "8%",
}: {
  /** Kept for existing call sites; the glass has no directional sheen now. */
  refractionSide?: "left" | "right";
  specularInset?: string;
} = {}) {
  return (
    <>
      {/* the bubbles' lens along the rim (Chromium) */}
      <CardLens />
      {/* the rim and the specular line sit in a mask the liquid swells can
          open (.ring-mask), so nothing on the edge crosses a swell */}
      <div className="ring-mask" style={{ zIndex: 1 }}>
        <div className="edge-ring" />
        <div
          className="glass-spec"
          style={{
            position: "absolute",
            top: 0,
            left: specularInset,
            right: specularInset,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.9) 30%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 70%, transparent)",
            opacity: 0.55,
          }}
        />
      </div>
    </>
  );
}
