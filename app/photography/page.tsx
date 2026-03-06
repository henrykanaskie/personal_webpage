"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useIsDark } from "@/components/InfoBubble";
import { SECTIONS, Section, PhotoEntry, RGB } from "@/app/photography/data";

// Shared gallery tile sizing
const PREVIEW_BASE = 230;

function PhotoFrame({
  photo,
  isDark,
  accent,
  index,
  sectionId,
}: {
  photo: PhotoEntry;
  isDark: boolean;
  accent: RGB;
  index: number;
  sectionId: string;
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
  const ref = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });

  const accent = isDark ? section.darkAccent : section.lightAccent;

  const titleColor = isDark ? "rgb(218, 198, 228)" : "rgb(100, 80, 115)";
  const numColor = isDark ? "rgb(185, 165, 210)" : "rgb(120, 95, 135)";
  const subColor = isDark ? "rgb(198, 178, 218)" : "rgb(110, 88, 128)";
  const ruleColor = isDark ? "rgba(195,175,225,0.12)" : "rgba(128,72,138,0.15)";
  const dividerColor = isDark
    ? "rgba(195,175,225,0.05)"
    : "rgba(128,72,138,0.06)";
  const seeMoreColor = isDark ? "rgb(198, 178, 218)" : "rgb(110, 88, 128)";
  const seeMoreBorder = isDark
    ? "rgba(195,175,225,0.12)"
    : "rgba(128,72,138,0.15)";

  const previewPhotos = section.photos;

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
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 18,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              color: numColor,
              fontSize: "10px",
              letterSpacing: "0.3em",
              fontFamily: "monospace",
              flexShrink: 0,
            }}
          >
            {section.num}
          </span>
          <div
            style={{
              width: 48,
              height: "0.5px",
              background: ruleColor,
              flexShrink: 0,
              alignSelf: "center",
            }}
          />
          <h2 style={{ margin: 0 }}>
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
        </div>
        <p
          style={{
            color: subColor,
            fontSize: "9.5px",
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            margin: "0 0 0 76px",
          }}
        >
          {section.sub}
        </p>
      </motion.div>

      {/* Same-width view box: horizontal scroll gallery, View More at end */}
      <div style={{ position: "relative", width: "100%", maxWidth: 960 }}>
        <div
          ref={scrollRef}
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
            {previewPhotos.map((photo, gi) => (
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
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = isDark
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
        {/* Faint scroll hints */}
        <button
          type="button"
          aria-label="Scroll gallery left"
          onClick={() =>
            scrollRef.current?.scrollBy({ left: -280, behavior: "smooth" })
          }
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 4,
            width: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isDark
              ? "linear-gradient(90deg, rgba(20,18,26,0.6) 0%, transparent 100%)"
              : "linear-gradient(90deg, rgba(255,252,255,0.7) 0%, transparent 100%)",
            border: "none",
            cursor: "pointer",
            color: seeMoreColor,
            opacity: 0.85,
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.85";
          }}
        >
          <span style={{ fontSize: "20px", lineHeight: 1 }}>‹</span>
        </button>
        <button
          type="button"
          aria-label="Scroll gallery right"
          onClick={() =>
            scrollRef.current?.scrollBy({ left: 280, behavior: "smooth" })
          }
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 4,
            width: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isDark
              ? "linear-gradient(270deg, rgba(20,18,26,0.6) 0%, transparent 100%)"
              : "linear-gradient(270deg, rgba(255,252,255,0.7) 0%, transparent 100%)",
            border: "none",
            cursor: "pointer",
            color: seeMoreColor,
            opacity: 0.85,
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.85";
          }}
        >
          <span style={{ fontSize: "20px", lineHeight: 1 }}>›</span>
        </button>
      </div>

      {/* Section divider */}
      <div
        style={{
          marginTop: "clamp(28px, 4vw, 48px)",
          height: "0.5px",
          background: dividerColor,
        }}
      />
    </section>
  );
}

export default function PhotographyPage() {
  const isDark = useIsDark();

  const titleColor = isDark ? "rgb(218, 198, 228)" : "rgb(100, 80, 115)";
  const subColor = isDark ? "rgb(198, 178, 218)" : "rgb(110, 88, 128)";
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
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <span
            style={{
              color: subColor,
              fontSize: "10px",
              letterSpacing: "0.3em",
              fontFamily: "monospace",
              flexShrink: 0,
            }}
          >
            gallery
          </span>
          <div
            style={{
              width: 48,
              height: "0.5px",
              background: ruleColor,
              alignSelf: "center",
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

      {SECTIONS.map((section) => (
        <PhotoSectionPreview key={section.id} section={section} isDark={isDark} />
      ))}
    </div>
  );
}
