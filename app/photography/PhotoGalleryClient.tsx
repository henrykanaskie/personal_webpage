"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useIsDark, useIsMobile } from "@/components/InfoBubble";
import { Section, PhotoEntry, RGB } from "@/app/photography/data";

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  selected,
  photos,
  section,
  isDark,
  onClose,
  onPrev,
  onNext,
}: {
  selected: { photo: PhotoEntry; gi: number };
  photos: PhotoEntry[];
  section: Section;
  isDark: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { photo, gi } = selected;
  const [w, h] = photo.ratio.split("/").map(Number);
  const ratio = w / h || 1;
  const baseWidth = 1600;
  const baseHeight = Math.round(baseWidth / ratio);

  const subColor = isDark ? "rgb(198, 178, 218)" : "rgb(110, 88, 128)";
  const ruleColor = isDark ? "rgba(195,175,225,0.1)" : "rgba(128,72,138,0.12)";

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) onNext();
      else onPrev();
    }
    touchStartX.current = null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: isDark ? "rgba(5,5,8,0.92)" : "rgba(248,245,240,0.94)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      {/* Image — fills as much of the viewport as possible */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", lineHeight: 0 }}
      >
        <Image
          src={photo.src}
          alt={photo.alt ?? `${section.id} photo ${String(gi + 1).padStart(2, "0")}`}
          width={baseWidth}
          height={baseHeight}
          sizes="100vw"
          style={{
            display: "block",
            maxWidth: "100vw",
            maxHeight: "100dvh",
            width: "auto",
            height: "auto",
            objectFit: "contain",
          }}
          priority
        />

        {/* Close button — overlaid top-right on the image */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close enlarged photo"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 2,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            border: "none",
            background: isDark ? "rgba(5,5,8,0.72)" : "rgba(248,245,240,0.82)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "14px", lineHeight: 1, color: isDark ? "#f7f1ff" : "#503c60" }}>
            ×
          </span>
        </button>

        {/* Prev arrow — overlaid left edge of image */}
        {gi > 0 && (
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              border: "none",
              background: isDark ? "rgba(5,5,8,0.55)" : "rgba(248,245,240,0.65)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              cursor: "pointer",
              color: isDark ? "#f7f1ff" : "#503c60",
              fontSize: 24,
              lineHeight: 1,
            }}
          >
            ‹
          </button>
        )}

        {/* Next arrow — overlaid right edge of image */}
        {gi < photos.length - 1 && (
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              border: "none",
              background: isDark ? "rgba(5,5,8,0.55)" : "rgba(248,245,240,0.65)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              cursor: "pointer",
              color: isDark ? "#f7f1ff" : "#503c60",
              fontSize: 24,
              lineHeight: 1,
            }}
          >
            ›
          </button>
        )}

        {/* Caption — overlaid bottom of image */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "20px 16px 12px",
            background: isDark
              ? "linear-gradient(to top, rgba(5,5,8,0.6), transparent)"
              : "linear-gradient(to top, rgba(248,245,240,0.55), transparent)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "8px", letterSpacing: "0.3em", textTransform: "uppercase", fontFamily: "monospace", color: isDark ? "rgba(220,210,240,0.6)" : "rgba(80,60,95,0.6)" }}>
              {section.title}
            </span>
            <div style={{ width: 1, height: 10, background: ruleColor }} />
            <span style={{ fontSize: "8px", letterSpacing: "0.22em", fontFamily: "monospace", color: isDark ? "rgba(220,210,240,0.42)" : "rgba(80,60,95,0.42)" }}>
              {String(gi + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
            </span>
          </div>
          <Link
            href={`/photography/${section.id}`}
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "8px", letterSpacing: "0.35em", textTransform: "uppercase", color: subColor, textDecoration: "none" }}
          >
            View All
            <span style={{ fontSize: "10px", letterSpacing: 0, opacity: 0.7 }}>→</span>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Shared gallery tile sizing
const PREVIEW_BASE = 300;

function PhotoFrame({
  photo,
  isDark,
  accent,
  index,
  sectionId,
  onClick,
}: {
  photo: PhotoEntry;
  isDark: boolean;
  accent: RGB;
  index: number;
  sectionId: string;
  onClick?: () => void;
}) {
  const [r, g, b] = accent;
  const filterId = `grain-gallery-${sectionId}-${index}`;

  const [wRatio, hRatio] = photo.ratio.split("/").map(Number);
  const ratio = wRatio / hRatio;
  const displayHeight = PREVIEW_BASE;
  const displayWidth = Math.round(PREVIEW_BASE * ratio);

  return (
    <motion.div
      whileHover={{ scale: 1.015, filter: "brightness(1.14)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      style={{
        width: displayWidth,
        height: displayHeight,
        flexShrink: 0,
        position: "relative",
        borderRadius: 2,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`,
        boxShadow: isDark
          ? "inset 0 0 40px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.45)"
          : "inset 0 0 20px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.09)",
        cursor: "pointer",
        overflow: "hidden",
        lineHeight: 0,
      }}
    >
      <Image
        src={photo.src}
        alt={photo.alt ?? `${sectionId} photo ${index + 1}`}
        width={displayWidth}
        height={displayHeight}
        sizes="(min-width: 768px) 230px, 50vw"
        style={{
          width: displayWidth,
          height: displayHeight,
          maxWidth: "none",
          opacity: isDark ? 0.92 : 0.96,
          display: "block",
        }}
        priority={sectionId === "portraits" && index < 2}
      />

      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: isDark ? 0.07 : 0.05, mixBlendMode: "overlay" }}
      >
        <defs>
          <filter id={filterId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.72"
              numOctaves="4"
              stitchTiles="stitch"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>
      <span
        style={{
          position: "absolute",
          bottom: 10,
          right: 12,
          fontSize: "7.5px",
          letterSpacing: "0.22em",
          fontFamily: "monospace",
          color: `rgba(${r},${g},${b},${isDark ? 0.45 : 0.55})`,
          userSelect: "none",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
    </motion.div>
  );
}

function PhotoSectionPreview({
  section,
  isDark,
}: {
  section: Section;
  isDark: boolean;
}) {
  const isMobile = useIsMobile();
  const ref = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [selected, setSelected] = useState<{ photo: PhotoEntry; gi: number } | null>(null);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  // Set initial edge state after mount
  useEffect(() => {
    updateEdges();
  }, [updateEdges]);

  // Scroll lock when lightbox open
  useEffect(() => {
    if (!selected) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, [selected]);

  // Arrow key + Escape navigation
  const selectedRef = useRef(selected);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => {
    const photos = section.photos.slice(0, 9);
    const onKey = (e: KeyboardEvent) => {
      const cur = selectedRef.current;
      if (!cur) return;
      if (e.key === "ArrowRight") {
        const next = cur.gi + 1;
        if (next < photos.length) setSelected({ photo: photos[next], gi: next });
      } else if (e.key === "ArrowLeft") {
        const prev = cur.gi - 1;
        if (prev >= 0) setSelected({ photo: photos[prev], gi: prev });
      } else if (e.key === "Escape") {
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [section]);

  const accent = isDark ? section.darkAccent : section.lightAccent;

  const titleColor = isDark ? "rgb(218, 198, 228)" : "rgb(100, 80, 115)";
  const subColor = isDark ? "rgb(198, 178, 218)" : "rgb(110, 88, 128)";
  const ruleColor = isDark ? "rgba(195,175,225,0.12)" : "rgba(128,72,138,0.15)";
  const dividerColor = isDark
    ? "rgba(195,175,225,0.05)"
    : "rgba(128,72,138,0.06)";
  const seeMoreColor = isDark ? "rgb(198, 178, 218)" : "rgb(110, 88, 128)";
  const seeMoreBorder = isDark
    ? "rgba(195,175,225,0.12)"
    : "rgba(128,72,138,0.15)";

  if (section.photos.length === 0) return null;

  return (
    <section
      ref={ref}
      id={section.id}
      style={{
        scrollMarginTop: "88px",
        position: "relative",
        marginBottom: "clamp(40px, 6vw, 64px)",
      }}
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={{ marginBottom: "clamp(24px, 3vw, 36px)" }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 36,
              height: "0.5px",
              background: ruleColor,
              margin: "0 auto 14px",
            }}
          />
          <h2 style={{ margin: "0 0 8px" }}>
            <Link
              href={`/photography/${section.id}`}
              style={{
                color: titleColor,
                fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)",
                fontWeight: 300,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                lineHeight: 1.05,
                textDecoration: "none",
                cursor: "pointer",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.75";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              {section.title}
            </Link>
          </h2>
          <p
            style={{
              color: subColor,
              fontSize: "9.5px",
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              margin: "0 0 16px",
            }}
          >
            {section.sub}
          </p>
          <Link
            href={`/photography/${section.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontSize: "8px",
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              color: subColor,
              textDecoration: "none",
              padding: "7px 18px",
              border: `0.5px solid ${ruleColor}`,
              borderRadius: 1,
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = isDark ? "rgba(200,170,255,0.32)" : "rgba(130,65,145,0.35)";
              el.style.opacity = "0.75";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = ruleColor;
              el.style.opacity = "1";
            }}
          >
            View All
            <span style={{ fontSize: "10px", letterSpacing: 0 }}>→</span>
          </Link>
        </div>
      </motion.div>

      {/* Scroll gallery — full viewport width regardless of container max-width */}
      <div
        style={{
          width: "100vw",
          marginLeft: "calc(50% - 50vw)",
          paddingLeft: "clamp(16px, 10vw, 160px)",
          paddingRight: "clamp(16px, 10vw, 160px)",
          boxSizing: "border-box",
        }}
      >
        {/* Inner wrapper is position:relative so fades anchor to scroll content, not outer padding */}
        <div style={{ position: "relative" }}>
          <div
            ref={scrollRef}
            onScroll={updateEdges}
            style={{
              width: "100%",
              overflowX: "auto",
              overflowY: "hidden",
              marginLeft: 0,
              marginRight: 0,
              scrollbarGutter: "stable",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "nowrap",
                gap: 8,
                alignItems: "flex-end",
                minWidth: "min-content",
                paddingBottom: 4,
              }}
            >
              {section.photos.slice(0, 9).map((photo, gi) => (
                <motion.div
                  key={gi}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: 0.1 + gi * 0.03,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <PhotoFrame
                    photo={photo}
                    isDark={isDark}
                    accent={accent}
                    index={gi}
                    sectionId={section.id}
                    onClick={() => setSelected({ photo, gi })}
                  />
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                  flexShrink: 0,
                  height: PREVIEW_BASE,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 12,
                }}
              >
                <Link
                  href={`/photography/${section.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "8.5px",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: seeMoreColor,
                    textDecoration: "none",
                    padding: "8px 16px",
                    border: `0.5px solid ${seeMoreBorder}`,
                    borderRadius: 1,
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      isDark
                        ? "rgba(200,170,255,0.35)"
                        : "rgba(130,65,145,0.38)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      seeMoreBorder;
                  }}
                >
                  View More
                  <span style={{ fontSize: "10px", letterSpacing: 0 }}>→</span>
                </Link>
              </motion.div>
            </div>
          </div>
          {/* Left fade + arrow */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 4,
              width: 180,
              pointerEvents: "none",
              background: isDark
                ? "linear-gradient(90deg, rgba(14,11,22,1) 0%, rgba(14,11,22,0.97) 10%, rgba(14,11,22,0.91) 20%, rgba(14,11,22,0.82) 32%, rgba(14,11,22,0.68) 45%, rgba(14,11,22,0.5) 58%, rgba(14,11,22,0.3) 72%, rgba(14,11,22,0.12) 86%, transparent 100%)"
                : "linear-gradient(90deg, rgba(252,249,255,1) 0%, rgba(252,249,255,0.97) 10%, rgba(252,249,255,0.91) 20%, rgba(252,249,255,0.82) 32%, rgba(252,249,255,0.68) 45%, rgba(252,249,255,0.5) 58%, rgba(252,249,255,0.3) 72%, rgba(252,249,255,0.12) 86%, transparent 100%)",
              opacity: atStart ? 0 : 1,
              transition: "opacity 0.25s ease",
              display: isMobile ? "none" : "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingLeft: 16,
            }}
          >
            <button
              type="button"
              aria-label="Scroll gallery left"
              onClick={() =>
                scrollRef.current?.scrollBy({ left: -320, behavior: "smooth" })
              }
              style={{
                pointerEvents: atStart ? "none" : "auto",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)"}`,
                background: isDark
                  ? "rgba(10,8,16,0.6)"
                  : "rgba(252,248,255,0.7)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                cursor: "pointer",
                color: isDark
                  ? "rgba(220,210,240,0.9)"
                  : "rgba(80,55,100,0.85)",
                fontSize: 20,
                lineHeight: 1,
              }}
            >
              ‹
            </button>
          </div>

          {/* Right fade + arrow */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 4,
              width: 180,
              pointerEvents: "none",
              background: isDark
                ? "linear-gradient(270deg, rgba(14,11,22,1) 0%, rgba(14,11,22,0.97) 10%, rgba(14,11,22,0.91) 20%, rgba(14,11,22,0.82) 32%, rgba(14,11,22,0.68) 45%, rgba(14,11,22,0.5) 58%, rgba(14,11,22,0.3) 72%, rgba(14,11,22,0.12) 86%, transparent 100%)"
                : "linear-gradient(270deg, rgba(252,249,255,1) 0%, rgba(252,249,255,0.97) 10%, rgba(252,249,255,0.91) 20%, rgba(252,249,255,0.82) 32%, rgba(252,249,255,0.68) 45%, rgba(252,249,255,0.5) 58%, rgba(252,249,255,0.3) 72%, rgba(252,249,255,0.12) 86%, transparent 100%)",
              opacity: atEnd ? 0 : 1,
              transition: "opacity 0.25s ease",
              display: isMobile ? "none" : "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: 16,
            }}
          >
            <button
              type="button"
              aria-label="Scroll gallery right"
              onClick={() =>
                scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" })
              }
              style={{
                pointerEvents: atEnd ? "none" : "auto",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)"}`,
                background: isDark
                  ? "rgba(10,8,16,0.6)"
                  : "rgba(252,248,255,0.7)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                cursor: "pointer",
                color: isDark
                  ? "rgba(220,210,240,0.9)"
                  : "rgba(80,55,100,0.85)",
                fontSize: 20,
                lineHeight: 1,
              }}
            >
              ›
            </button>
          </div>
        </div>{" "}
        {/* end inner position:relative wrapper */}
      </div>

      {/* Section divider */}
      <div
        style={{
          marginTop: "clamp(28px, 4vw, 48px)",
          height: "0.5px",
          background: dividerColor,
        }}
      />

      {/* Lightbox */}
      {selected && (
        <Lightbox
          selected={selected}
          photos={section.photos.slice(0, 9)}
          section={section}
          isDark={isDark}
          onClose={() => setSelected(null)}
          onPrev={() => {
            const prev = selected.gi - 1;
            if (prev >= 0) setSelected({ photo: section.photos[prev], gi: prev });
          }}
          onNext={() => {
            const next = selected.gi + 1;
            if (next < section.photos.slice(0, 9).length)
              setSelected({ photo: section.photos[next], gi: next });
          }}
        />
      )}
    </section>
  );
}

export default function PhotoGalleryClient({
  sections,
}: {
  sections: Section[];
}) {
  const isDark = useIsDark();

  const titleColor = isDark ? "rgb(218, 198, 228)" : "rgb(100, 80, 115)";
  const ruleColor = isDark ? "rgba(195,175,225,0.12)" : "rgba(128,72,138,0.15)";

  return (
    <div
      style={{
        position: "relative",
        padding: "clamp(64px, 8vw, 100px) clamp(20px, 5vw, 72px)",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      {/* My Photography header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ marginBottom: "clamp(32px, 4vw, 48px)" }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 36,
              height: "0.5px",
              background: ruleColor,
              margin: "0 auto 16px",
            }}
          />
          <h1
            style={{
              color: titleColor,
              fontSize: "clamp(2rem, 4.5vw, 3.8rem)",
              fontWeight: 300,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            My Photography
          </h1>
        </div>
      </motion.div>

      {sections.map((section) => (
        <PhotoSectionPreview
          key={section.id}
          section={section}
          isDark={isDark}
        />
      ))}
    </div>
  );
}
