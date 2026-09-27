"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { photoTheme } from "@/components/photo/utils";

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

export function PhotographyFilmStripNav({
  isDark,
  visible,
  pathname,
  leftControls,
  rightControls,
}: {
  isDark: boolean;
  visible: boolean;
  pathname: string | null;
  leftControls?: React.ReactNode;
  rightControls?: React.ReactNode;
}) {
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
    const activeIndex = photoNavLinks.findIndex((item) => item.href === pathname);
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
    setTimeout(() => {
      hasMoved.current = false;
    }, 0);
  };

  // Same tokens as the photography pages, so the nav sits in the page instead of on top of it
  const t = photoTheme(isDark);
  const stripBg = isDark ? "rgba(5,5,7,0.88)" : "rgba(248,245,240,0.9)";

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
          height: 1,
          pointerEvents: "none",
          background: t.rule,
        }}
      />

      {/* Left controls: pinned to the left, never scrolls away */}
      {leftControls && (
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingLeft: 14,
            paddingRight: 8,
          }}
        >
          {leftControls}
        </div>
      )}

      {/* Left scroll arrow: only shown when content overflows */}
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
            color: t.faint,
            fontSize: 16,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          ‹
        </button>
      )}

      {/* Scrollable nav items: takes all available space */}
      <div
        ref={scrollRef}
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
          gap: 0,
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
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(2px, 1.2vw, 18px)", margin: "0 auto" }}>
          {photoNavLinks.map((item, i) => {
            const active = pathname === item.href;
            const hovered = hoveredIndex === i;

            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                scroll={false}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                aria-label={item.name}
                style={{
                  flexShrink: 0,
                  scrollSnapAlign: "center",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  position: "relative",
                  padding: "8px 10px 9px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-elevated)",
                    fontSize: 14,
                    fontWeight: active ? 500 : 400,
                    letterSpacing: "0.005em",
                    whiteSpace: "nowrap",
                    color: active || hovered ? t.ink : t.sub,
                    transition: "color 0.25s ease",
                  }}
                >
                  {item.name}
                </span>
                {/* One hairline that glides to whichever page you're on */}
                {active && (
                  <motion.span
                    layoutId="photo-nav-underline"
                    transition={{ type: "spring", stiffness: 420, damping: 38 }}
                    style={{ position: "absolute", left: 10, right: 10, bottom: 2, height: 1, background: t.ink }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right scroll arrow: only shown when content overflows */}
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
            color: t.faint,
            fontSize: 16,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          ›
        </button>
      )}

      {/* Controls: pinned to the right, never scrolls away */}
      {rightControls && (
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
          {rightControls}
        </div>
      )}
    </header>
  );
}
