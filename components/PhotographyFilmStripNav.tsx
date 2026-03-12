"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SECTION_META as SECTIONS } from "@/app/photography/data";

const photoNavLinks: { name: string; href: string }[] = [
  { name: "About", href: "/photography/about" },
  { name: "Gallery", href: "/photography" },
  { name: "Portraits", href: "/photography/portraits" },
  { name: "Nature", href: "/photography/nature" },
  { name: "Astro", href: "/photography/astrophotography" },
  { name: "Street", href: "/photography/street" },
  { name: "Automotive", href: "/photography/automotive" },
  { name: "Natl Parks", href: "/photography/natl-parks" },
];

const HOVER_SCALE = 1.04;
const ACTIVE_SCALE = 1.02;

function getSectionId(href: string): string | null {
  if (href === "/photography" || href === "/photography/about") return null;
  const id = href.replace("/photography/", "").replace("/photography", "") || null;
  return id;
}

function buildStripItems(isDark: boolean) {
  const fallbackAccent: [number, number, number] = [128, 72, 138];

  return photoNavLinks.map((link) => {
    const sectionId = getSectionId(link.href);
    const section = sectionId ? SECTIONS.find((s) => s.id === sectionId) : null;
    const accent = section
      ? (isDark ? section.darkAccent : section.lightAccent)
      : fallbackAccent;
    return {
      ...link,
      sub: section?.sub ?? "",
      accent,
    };
  });
}

export function PhotographyFilmStripNav({
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
  const stripItems = buildStripItems(isDark);
  const isActive = (href: string) => pathname === href;
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const hasMoved = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  useEffect(() => {
    const activeIndex = stripItems.findIndex((item) => item.href === pathname);
    if (activeIndex !== -1 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [pathname]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    hasMoved.current = false;
    dragStartX.current = e.pageX;
    dragScrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    const dx = e.pageX - dragStartX.current;
    if (Math.abs(dx) > 5) {
      e.preventDefault();
      hasMoved.current = true;
      setIsDragging(true);
      scrollRef.current.scrollLeft = dragScrollLeft.current - dx;
    }
  };

  const stopDragging = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setTimeout(() => { hasMoved.current = false; }, 0);
  };

  const labelColor = isDark ? "rgb(238, 225, 248)" : "rgb(80, 62, 95)";
  const subColor = isDark ? "rgba(220,210,245,0.7)" : "rgba(90,65,120,0.7)";
  const stripBg = isDark
    ? "linear-gradient(180deg, rgba(12,10,18,0.75) 0%, rgba(8,6,14,0.8) 100%)"
    : "linear-gradient(180deg, rgba(252,248,244,0.78) 0%, rgba(248,244,238,0.82) 100%)";

  return (
    <header
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        top: 0,
        zIndex: 60,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        transition: "opacity 0.35s ease, transform 0.4s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: visible ? "auto" : "none",
        isolation: "isolate",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        background: stripBg,
        paddingTop: "max(10px, env(safe-area-inset-top))",
        paddingBottom: 8,
      }}
    >
      {/* Subtle bottom edge */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          pointerEvents: "none",
          background: isDark
            ? "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(200,185,230,0.18) 20%, rgba(110,140,255,0.16) 50%, rgba(200,185,230,0.18) 80%, rgba(255,255,255,0) 100%)"
            : "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(120,85,145,0.14) 20%, rgba(70,85,115,0.12) 50%, rgba(120,85,145,0.14) 80%, rgba(0,0,0,0) 100%)",
          filter: "blur(0.2px)",
          opacity: 0.9,
        }}
      />

      {/* Left scroll arrow — only shown when content overflows */}
      {canScroll && (
        <button
          type="button"
          aria-label="Scroll nav left"
          onClick={() => scrollRef.current?.scrollBy({ left: -120, behavior: "smooth" })}
          style={{
            flexShrink: 0,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 4px 0 8px",
            color: isDark ? "rgba(220,210,245,0.45)" : "rgba(90,65,120,0.4)",
            fontSize: 16,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          ‹
        </button>
      )}

      {/* Scrollable nav items — takes all available space */}
      <div
        ref={scrollRef}
        className="scrollbar-hide"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        onClickCapture={(e) => {
          if (hasMoved.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-evenly",
          gap: 4,
          paddingLeft: 4,
          paddingRight: 4,
          flexWrap: "nowrap",
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          cursor: isDragging ? "grabbing" : canScroll ? "grab" : "default",
          userSelect: "none",
        }}
      >
        {stripItems.map((item, i) => {
          const active = isActive(item.href);
          const hovered = hoveredIndex === i;
          const viewBoxColor = isDark
            ? "rgba(238,225,248,0.35)"
            : "rgba(80,62,95,0.26)";
          const viewBoxShadow = isDark
            ? "rgba(238,225,248,0.14)"
            : "rgba(80,62,95,0.10)";

          return (
            <Link
              key={item.href}
              href={item.href}
              ref={(el) => { itemRefs.current[i] = el; }}
              scroll={false}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => sessionStorage.setItem("lastBranch", "photo")}
              aria-label={item.name}
              style={{
                flexShrink: 0,
                scrollSnapAlign: "center",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                position: "relative",
                padding: "8px 10px 6px",
                borderRadius: 14,
              }}
            >
              {active && (
                <motion.div
                  layoutId="photo-nav-viewfinder"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  style={{
                    position: "absolute",
                    inset: -8,
                    borderRadius: 18,
                    pointerEvents: "none",
                    border: `1px solid ${viewBoxColor}`,
                    boxShadow: `0 0 18px ${viewBoxShadow}`,
                  }}
                >
                  {[
                    { left: 10, top: 10, rotate: 0 },
                    { right: 10, top: 10, rotate: 90 },
                    { right: 10, bottom: 10, rotate: 180 },
                    { left: 10, bottom: 10, rotate: 270 },
                  ].map((pos, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "absolute",
                        width: 12,
                        height: 12,
                        ...(pos.left != null ? { left: pos.left } : {}),
                        ...(pos.right != null ? { right: pos.right } : {}),
                        ...(pos.top != null ? { top: pos.top } : {}),
                        ...(pos.bottom != null ? { bottom: pos.bottom } : {}),
                        transform: `rotate(${pos.rotate}deg)`,
                        borderTop: `1px solid ${viewBoxColor}`,
                        borderLeft: `1px solid ${viewBoxColor}`,
                        borderTopLeftRadius: 3,
                        opacity: 0.95,
                      }}
                    />
                  ))}
                </motion.div>
              )}
              <motion.div
                layout
                animate={{
                  scale: hovered ? HOVER_SCALE : active ? ACTIVE_SCALE : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: active ? labelColor : subColor,
                  transformOrigin: "center center",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                    fontWeight: active ? 700 : 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.name}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Right scroll arrow — only shown when content overflows */}
      {canScroll && (
        <button
          type="button"
          aria-label="Scroll nav right"
          onClick={() => scrollRef.current?.scrollBy({ left: 120, behavior: "smooth" })}
          style={{
            flexShrink: 0,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 4px",
            color: isDark ? "rgba(220,210,245,0.45)" : "rgba(90,65,120,0.4)",
            fontSize: 16,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          ›
        </button>
      )}

      {/* Controls — pinned to the right, never scrolls away */}
      {bottomControls && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingLeft: 8,
            paddingRight: 14,
          }}
        >
          {bottomControls}
        </div>
      )}
    </header>
  );
}
