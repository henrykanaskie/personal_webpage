"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { SECTIONS } from "@/app/photography/data";

const photoNavLinks = [
  { name: "About", short: "ABT", href: "/photography/about" },
  { name: "Gallery", short: "GAL", href: "/photography" },
  { name: "Portraits", short: "PORT", href: "/photography/portraits" },
  { name: "Nature", short: "NAT", href: "/photography/landscape" },
  { name: "Astro", short: "ASTR", href: "/photography/astrophotography" },
  { name: "Street", short: "STR", href: "/photography/street" },
  { name: "Automotive", short: "AUTO", href: "/photography/automotive" },
  { name: "Collages", short: "COLL", href: "/photography/collages" },
];

const VIEWFINDER_W = 200;
const VIEWFINDER_H = 133; // 3:2
const BEZEL = 10;
const FOCUS_POINT_R = 6;
const GRID_OPACITY = 0.35;

function getSectionId(href: string): string | null {
  if (href === "/photography" || href === "/photography/about") return null;
  const id = href.replace("/photography/", "").replace("/photography", "") || null;
  return id;
}

function buildNavItems(isDark: boolean) {
  const fallbackSrc = SECTIONS[0]?.photos?.[0]?.src ?? "/photography/placeholder.svg";
  const fallbackAccent: [number, number, number] = [128, 72, 138];

  return photoNavLinks.map((link) => {
    const sectionId = getSectionId(link.href);
    const section = sectionId ? SECTIONS.find((s) => s.id === sectionId) : null;
    const accent = section
      ? (isDark ? section.darkAccent : section.lightAccent)
      : fallbackAccent;
    return {
      ...link,
      thumbnailSrc: section?.photos?.[0]?.src ?? fallbackSrc,
      sub: section?.sub ?? "",
      accent,
    };
  });
}

export function PhotographyViewfinderNav({
  isDark,
  visible,
  pathname,
  bottomControls,
}: {
  isDark: boolean;
  visible: boolean;
  pathname: string | null;
  bottomControls?: React.ReactNode;
}) {
  const items = buildNavItems(isDark);
  const isActive = (href: string) => pathname === href;
  const activeIndex = items.findIndex((item) => isActive(item.href));
  const previewItem = activeIndex >= 0 ? items[activeIndex] : items[0];

  const bezelBg = isDark
    ? "linear-gradient(145deg, rgba(18,14,24,0.98) 0%, rgba(10,8,14,0.98) 100%)"
    : "linear-gradient(145deg, rgba(38,34,42,0.97) 0%, rgba(28,24,32,0.97) 100%)";
  const borderColor = isDark ? "rgba(200,185,230,0.15)" : "rgba(120,85,145,0.12)";
  const gridColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)";
  const focusInactive = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";
  const focusActive = "rgba(220, 60, 80, 0.95)";
  const labelColor = isDark ? "rgb(238, 225, 248)" : "rgb(80, 62, 95)";

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(100%)",
    transition: "opacity 0.35s ease, transform 0.4s cubic-bezier(0.4,0,0.2,1)",
    pointerEvents: visible ? "auto" : "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "16px 20px",
    paddingBottom: "max(20px, env(safe-area-inset-bottom))",
    background: isDark
      ? "linear-gradient(0deg, rgba(12,10,18,0.97) 0%, rgba(18,14,24,0.95) 100%)"
      : "linear-gradient(0deg, rgba(252,248,244,0.97) 0%, rgba(248,244,238,0.95) 100%)",
    backdropFilter: "blur(20px) saturate(1.2)",
    WebkitBackdropFilter: "blur(20px) saturate(1.2)",
    borderTop: `1px solid ${borderColor}`,
    boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
  };

  return (
    <>
      {/* Desktop: bottom bar — viewfinder + choices row + controls */}
      <header className="hidden md:flex" style={containerStyle}>
        {/* Viewfinder frame (camera LCD / eyepiece) */}
        <div
          style={{
            padding: BEZEL,
            background: bezelBg,
            borderRadius: 12,
            border: `1px solid ${borderColor}`,
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)"
              : "0 8px 28px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: VIEWFINDER_W,
              height: VIEWFINDER_H,
              borderRadius: 6,
              overflow: "hidden",
              background: isDark ? "#0a080c" : "#1a161c",
            }}
          >
            {/* Live preview = current section thumbnail */}
            <Image
              src={previewItem.thumbnailSrc}
              alt=""
              width={VIEWFINDER_W}
              height={VIEWFINDER_H}
              sizes={`${VIEWFINDER_W}px`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            {/* Rule-of-thirds grid overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "33.33%",
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: gridColor,
                  opacity: GRID_OPACITY,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "66.66%",
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: gridColor,
                  opacity: GRID_OPACITY,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "33.33%",
                  left: 0,
                  right: 0,
                  height: 1,
                  background: gridColor,
                  opacity: GRID_OPACITY,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "66.66%",
                  left: 0,
                  right: 0,
                  height: 1,
                  background: gridColor,
                  opacity: GRID_OPACITY,
                }}
              />
            </div>
            {/* Focus points: 2×3 grid overlaid; click to navigate */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gridTemplateRows: "1fr 1fr 1fr",
                pointerEvents: "none",
              }}
            >
              {items.map((item, i) => {
                const active = isActive(item.href);
                return (
                  <div
                    key={item.href}
                    style={{
                      gridColumn: (i % 3) + 1,
                      gridRow: Math.floor(i / 3) + 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "auto",
                    }}
                  >
                    <Link
                      href={item.href}
                      scroll={false}
                      onClick={() => sessionStorage.setItem("lastBranch", "photo")}
                      title={item.name}
                      style={{ textDecoration: "none" }}
                    >
                      <motion.div
                        animate={{
                          scale: active ? 1.15 : 1,
                          borderColor: active ? focusActive : focusInactive,
                          boxShadow: active
                            ? `0 0 0 2px ${focusActive}, 0 0 12px ${focusActive}`
                            : "none",
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        style={{
                          width: FOCUS_POINT_R * 2,
                          height: FOCUS_POINT_R * 2,
                          borderRadius: "50%",
                          border: `2px solid ${focusInactive}`,
                          background: active ? "rgba(220,60,80,0.25)" : "transparent",
                          cursor: "pointer",
                        }}
                      />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Choices row: short names under viewfinder */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: "6px 14px",
          }}
        >
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                scroll={false}
                onClick={() => sessionStorage.setItem("lastBranch", "photo")}
                title={item.name}
                style={{
                  textDecoration: "none",
                  padding: "4px 8px",
                  borderRadius: 4,
                  background: active ? (isDark ? "rgba(200,185,230,0.12)" : "rgba(120,85,145,0.1)") : "transparent",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: active ? labelColor : (isDark ? "rgba(220,210,245,0.6)" : "rgba(90,65,120,0.6)"),
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {item.short}
                </span>
              </Link>
            );
          })}
        </div>

        {bottomControls && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {bottomControls}
          </div>
        )}
      </header>

      {/* Mobile: bottom bar — viewfinder + choices + controls */}
      <header
        className="md:hidden"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 60,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "opacity 0.3s ease, transform 0.35s ease",
          pointerEvents: visible ? "auto" : "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          paddingBottom: "max(14px, env(safe-area-inset-bottom))",
          background: isDark
            ? "linear-gradient(0deg, rgba(12,10,18,0.97) 0%, rgba(18,14,24,0.95) 100%)"
            : "linear-gradient(0deg, rgba(252,248,244,0.97) 0%, rgba(248,244,238,0.95) 100%)",
          backdropFilter: "blur(20px) saturate(1.2)",
          WebkitBackdropFilter: "blur(20px) saturate(1.2)",
          borderTop: `1px solid ${borderColor}`,
          boxShadow: "0 -4px 24px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            padding: 8,
            background: bezelBg,
            borderRadius: 10,
            border: `1px solid ${borderColor}`,
            boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
            width: "100%",
            maxWidth: 280,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "3/2",
              borderRadius: 6,
              overflow: "hidden",
              background: isDark ? "#0a080c" : "#1a161c",
            }}
          >
            <Image
              src={previewItem.thumbnailSrc}
              alt=""
              width={264}
              height={176}
              sizes="280px"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Grid */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {[1, 2].map((i) => (
                <div
                  key={`v${i}`}
                  style={{
                    position: "absolute",
                    left: `${i * 33.33}%`,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: gridColor,
                    opacity: GRID_OPACITY,
                  }}
                />
              ))}
              {[1, 2].map((i) => (
                <div
                  key={`h${i}`}
                  style={{
                    position: "absolute",
                    top: `${i * 33.33}%`,
                    left: 0,
                    right: 0,
                    height: 1,
                    background: gridColor,
                    opacity: GRID_OPACITY,
                  }}
                />
              ))}
            </div>
            {/* Focus points overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gridTemplateRows: "1fr 1fr 1fr",
              }}
            >
              {items.map((item, i) => {
                const active = isActive(item.href);
                return (
                  <div
                    key={item.href}
                    style={{
                      gridColumn: (i % 3) + 1,
                      gridRow: Math.floor(i / 3) + 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Link
                      href={item.href}
                      scroll={false}
                      onClick={() => sessionStorage.setItem("lastBranch", "photo")}
                      title={item.name}
                      style={{ textDecoration: "none" }}
                    >
                      <motion.div
                        animate={{
                          scale: active ? 1.2 : 1,
                          borderColor: active ? focusActive : focusInactive,
                          boxShadow: active ? `0 0 0 2px ${focusActive}` : "none",
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: `2px solid ${focusInactive}`,
                          background: active ? "rgba(220,60,80,0.3)" : "transparent",
                        }}
                      />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Labels row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                scroll={false}
                onClick={() => sessionStorage.setItem("lastBranch", "photo")}
                title={item.name}
                style={{
                  padding: "4px 8px",
                  borderRadius: 4,
                  background: active ? (isDark ? "rgba(200,185,230,0.12)" : "rgba(120,85,145,0.1)") : "transparent",
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: active ? labelColor : (isDark ? "rgba(220,210,245,0.6)" : "rgba(90,65,120,0.6)"),
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {item.short}
                </span>
              </Link>
            );
          })}
        </div>
        {bottomControls && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {bottomControls}
          </div>
        )}
      </header>
    </>
  );
}
