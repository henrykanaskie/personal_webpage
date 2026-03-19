"use client";

import { useState, useEffect } from "react";
import { glass } from "./tokens";

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

export const glassStyle: React.CSSProperties = {
  backdropFilter: glass.backdropFilter,
  WebkitBackdropFilter: glass.backdropFilter,
};

// ─── FuzzyText ──────────────────────────────────────────────────────────────

export const FuzzyText = ({
  children,
  style = {},
  className = "",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) => {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        zIndex: 1,
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: "-10px",
          zIndex: -1,
          filter: "blur(12px)",
          borderRadius: "15px",
          transform: "translateZ(0)",
        }}
        className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(21,21,21,0.4)]"
      />
      <span style={{ position: "relative", zIndex: 1 }} className={className}>
        {children}
      </span>
    </span>
  );
};

// ─── GlassLayers ────────────────────────────────────────────────────────────
// Renders the 5 decorator divs shared across all glass panels:
// specular top/bottom (light+dark), chromatic aberration, refraction, edge distortion

export function GlassLayers({
  refractionSide = "left",
  specularInset = "10%",
}: {
  refractionSide?: "left" | "right";
  specularInset?: string;
} = {}) {
  return (
    <>
      {/* Specular highlight — top */}
      <div
        className="dark:hidden"
        style={{
          position: "absolute",
          top: 0,
          left: specularInset,
          right: specularInset,
          height: "1px",
          background: glass.specular.top.light,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        className="hidden dark:block"
        style={{
          position: "absolute",
          top: 0,
          left: specularInset,
          right: specularInset,
          height: "1px",
          background: glass.specular.top.dark,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Specular highlight — bottom */}
      <div
        className="dark:hidden"
        style={{
          position: "absolute",
          bottom: 0,
          left: specularInset,
          right: specularInset,
          height: "1px",
          background: glass.specular.bottom.light,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        className="hidden dark:block"
        style={{
          position: "absolute",
          bottom: 0,
          left: specularInset,
          right: specularInset,
          height: "1px",
          background: glass.specular.bottom.dark,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Chromatic aberration */}
      <div
        style={{
          position: "absolute",
          top: -1,
          left: -1,
          right: -1,
          bottom: -1,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 0,
          boxShadow: glass.chromaticAberration,
        }}
      />

      {/* Internal refraction gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 0,
          background: glass.refraction[refractionSide],
        }}
      />

      {/* Edge distortion — heavier blur at edges */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 0,
          WebkitMaskImage: glass.edgeMask,
          maskImage: glass.edgeMask,
          backdropFilter: glass.edgeBlur,
          WebkitBackdropFilter: glass.edgeBlur,
        }}
      />
    </>
  );
}
