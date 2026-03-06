"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { useIsDark } from "@/components/InfoBubble";
import { SECTIONS, PhotoEntry, RGB } from "../data";

// ─── Photo frame ──────────────────────────────────────────────────────────────

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
  const filterId = `grain-cat-${sectionId}-${index}`;

  return (
    <motion.div
      whileHover={{ scale: 1.015, filter: "brightness(1.14)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      style={{
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
        width={1000}
        height={Math.round(
          1000 /
            (() => {
              const [w, h] = photo.ratio.split("/").map(Number);
              return w / h;
            })(),
        )}
        sizes="(min-width: 768px) 50vw, 90vw"
        style={{
          width: "100%",
          height: "auto",
          opacity: isDark ? 0.92 : 0.96,
          display: "block",
        }}
        priority={index < 2}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

// Inner animations stagger naturally; no extra delay needed since the
// PageTransition wrapper already handles the overall fade-in.
const ENTER_DELAY = 0;

export default function CategoryPage() {
  const params = useParams();
  const isDark = useIsDark();
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, margin: "-10% 0px" });
  const [selected, setSelected] = useState<{
    photo: PhotoEntry;
    gi: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const category = params?.category as string;
  const section = SECTIONS.find((s) => s.id === category);

  // Disable background scroll and signal the nav to hide while a photo is enlarged
  useEffect(() => {
    if (!selected) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("photoLightbox", { detail: { open: true } }));
    return () => {
      document.body.style.overflow = originalOverflow;
      window.dispatchEvent(new CustomEvent("photoLightbox", { detail: { open: false } }));
    };
  }, [selected]);

  // Keep a ref so the keyboard handler always has the latest selected value
  // without needing to re-register on every state change.
  const selectedRef = useRef(selected);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // Arrow key navigation — listener registered once per section, uses ref for current index
  useEffect(() => {
    if (!section) return;
    const onKey = (e: KeyboardEvent) => {
      const cur = selectedRef.current;
      if (!cur) return;
      if (e.key === "ArrowRight") {
        const next = cur.gi + 1;
        if (next < section.photos.length)
          setSelected({ photo: section.photos[next], gi: next });
      } else if (e.key === "ArrowLeft") {
        const prev = cur.gi - 1;
        if (prev >= 0)
          setSelected({ photo: section.photos[prev], gi: prev });
      } else if (e.key === "Escape") {
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [section]);

  if (!section) {
    notFound();
    return null;
  }

  const accent = isDark ? section.darkAccent : section.lightAccent;

  const titleColor = isDark ? "rgb(218, 198, 228)" : "rgb(100, 80, 115)";
  const numColor = isDark ? "rgb(185, 165, 210)" : "rgb(120, 95, 135)";
  const subColor = isDark ? "rgb(198, 178, 218)" : "rgb(110, 88, 128)";
  const ruleColor = isDark ? "rgba(195,175,225,0.12)" : "rgba(128,72,138,0.15)";
  const backBorder = isDark ? "rgba(195,175,225,0.1)" : "rgba(128,72,138,0.12)";

  return (
    <>
      {/* Content */}
      <div
        style={{
          position: "relative",
          padding: "clamp(48px, 8vw, 88px) clamp(20px, 5vw, 72px)",
        }}
      >
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.5,
            delay: ENTER_DELAY,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ marginBottom: "clamp(32px, 5vw, 56px)" }}
        >
          <Link
            href="/photography"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: "8.5px",
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              color: subColor,
              textDecoration: "none",
              padding: "8px 16px",
              border: `0.5px solid ${backBorder}`,
              borderRadius: 1,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = isDark
                ? "rgba(200,170,255,0.32)"
                : "rgba(130,65,145,0.35)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                backBorder;
            }}
          >
            <span style={{ fontSize: "10px", letterSpacing: 0 }}>←</span>
            All Photography
          </Link>
        </motion.div>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.65,
            delay: ENTER_DELAY + 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ marginBottom: "clamp(40px, 6vw, 72px)" }}
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
                fontSize: "clamp(1.6rem, 5.5vw, 5rem)",
                fontWeight: 300,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: "0 0 10px",
                lineHeight: 1.05,
              }}
            >
              {section.title}
            </h1>
          </div>
          <p
            style={{
              color: subColor,
              fontSize: "9.5px",
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              margin: 0,
              textAlign: "center",
            }}
          >
            {section.sub}
          </p>
        </motion.div>

        {/* Photo grid — flex-column masonry for puzzle-piece interlocking */}
        {(() => {
          // Separate portraits and landscapes, then interleave them
          // so orientations are mixed across columns
          const numCols = isMobile ? Math.min(section.cols, 2) : section.cols;
          const indexed = section.photos.map((photo, gi) => ({ photo, gi }));
          const portraits = indexed.filter(({ photo }) => {
            const [w, h] = photo.ratio.split("/").map(Number);
            return h > w;
          });
          const landscapes = indexed.filter(({ photo }) => {
            const [w, h] = photo.ratio.split("/").map(Number);
            return w >= h;
          });

          // Interleave: alternate picking from portraits and landscapes
          const interleaved: { photo: PhotoEntry; gi: number }[] = [];
          let pi = 0,
            li = 0;
          let pickPortrait = true;
          while (pi < portraits.length || li < landscapes.length) {
            if (pickPortrait && pi < portraits.length) {
              interleaved.push(portraits[pi++]);
            } else if (li < landscapes.length) {
              interleaved.push(landscapes[li++]);
            } else if (pi < portraits.length) {
              interleaved.push(portraits[pi++]);
            }
            pickPortrait = !pickPortrait;
          }

          // Distribute interleaved list into columns, shortest-first
          const cols: { photo: PhotoEntry; gi: number }[][] = Array.from(
            { length: numCols },
            () => [],
          );
          const heights = new Array(numCols).fill(0);
          interleaved.forEach((item) => {
            const shortest = heights.indexOf(Math.min(...heights));
            cols[shortest].push(item);
            const [w, h] = item.photo.ratio.split("/").map(Number);
            heights[shortest] += h / w;
          });

          // Blend column widths: halfway between equal and full aspect-ratio weighting
          const colAvgAspect = cols.map((col) => {
            if (col.length === 0) return 1;
            const sum = col.reduce((acc, { photo }) => {
              const [w, h] = photo.ratio.split("/").map(Number);
              return acc + w / h;
            }, 0);
            const raw = sum / col.length;
            return 0.5 + 0.5 * raw; // blend toward 1
          });

          return (
            <div
              ref={gridRef}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                width: "100%",
              }}
            >
              {cols.map((col, c) => (
                <div
                  key={c}
                  style={{
                    flex: colAvgAspect[c],
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {col.map(({ photo, gi }) => (
                    <motion.div
                      key={gi}
                      initial={{ opacity: 0, y: 28 }}
                      animate={gridInView ? { opacity: 1, y: 0 } : {}}
                      transition={{
                        duration: 0.55,
                        delay: ENTER_DELAY + 0.12 + gi * 0.045,
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
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Preload adjacent lightbox images so navigation feels instant */}
      {selected && ([-1, 1].map((offset) => {
        const idx = selected.gi + offset;
        if (idx < 0 || idx >= section.photos.length) return null;
        const p = section.photos[idx];
        const [w, h] = p.ratio.split("/").map(Number);
        return (
          <div
            key={idx}
            aria-hidden="true"
            style={{ position: "fixed", top: "-200vh", left: "-200vw", pointerEvents: "none" }}
          >
            <Image
              src={p.src}
              alt=""
              width={1600}
              height={Math.round(1600 / (w / h))}
              sizes="(min-width: 1024px) 70vw, 100vw"
              priority
            />
          </div>
        );
      }))}

      {/* Lightbox overlay for enlarged photo */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: isDark ? "rgba(5,5,8,0.88)" : "rgba(248,245,240,0.9)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 20px",
          }}
          onClick={() => setSelected(null)}
        >
          {/* Prev arrow */}
          {selected.gi > 0 && (
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                const prev = selected.gi - 1;
                setSelected({ photo: section.photos[prev], gi: prev });
              }}
              style={{
                position: "fixed",
                left: 20,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 61,
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
                background: isDark ? "rgba(10,10,14,0.75)" : "rgba(248,245,240,0.85)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                cursor: "pointer",
                color: isDark ? "#f7f1ff" : "#503c60",
                fontSize: 22,
                lineHeight: 1,
              }}
            >
              ‹
            </button>
          )}

          {/* Next arrow */}
          {selected.gi < section.photos.length - 1 && (
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                const next = selected.gi + 1;
                setSelected({ photo: section.photos[next], gi: next });
              }}
              style={{
                position: "fixed",
                right: 20,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 61,
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
                background: isDark ? "rgba(10,10,14,0.75)" : "rgba(248,245,240,0.85)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                cursor: "pointer",
                color: isDark ? "#f7f1ff" : "#503c60",
                fontSize: 22,
                lineHeight: 1,
              }}
            >
              ›
            </button>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "min(1200px, 94vw)",
              borderRadius: 4,
              overflow: "visible",
              border: `1px solid ${
                isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"
              }`,
              boxShadow: isDark
                ? "0 18px 60px rgba(0,0,0,0.85)"
                : "0 18px 50px rgba(0,0,0,0.35)",
              background: isDark ? "#050507" : "#f8f5f0",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 12,
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: "8px",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  color: isDark
                    ? "rgba(220,210,240,0.75)"
                    : "rgba(80,60,95,0.75)",
                }}
              >
                {section.title} ·{" "}
                {String((selected?.gi ?? 0) + 1).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close enlarged photo"
                style={{
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  border: "none",
                  background: isDark
                    ? "rgba(10,10,14,0.9)"
                    : "rgba(248,245,240,0.95)",
                  boxShadow: isDark
                    ? "0 0 0 1px rgba(255,255,255,0.18)"
                    : "0 0 0 1px rgba(0,0,0,0.12)",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    lineHeight: 1,
                    color: isDark ? "#f7f1ff" : "#503c60",
                  }}
                >
                  ×
                </span>
              </button>
            </div>

            {(() => {
              const { photo, gi } = selected;
              const [w, h] = photo.ratio.split("/").map(Number);
              const ratio = w / h || 1;

              // Use a generous intrinsic size; CSS will scale it to fit viewport
              const baseWidth = 1600;
              const baseHeight = Math.round(baseWidth / ratio);

              return (
                <div
                  style={{
                    maxWidth: "min(1200px, 94vw)",
                    maxHeight: "calc(100vh - 120px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src={photo.src}
                    alt={
                      photo.alt ??
                      `${section.id} photo ${String(gi + 1).padStart(2, "0")}`
                    }
                    width={baseWidth}
                    height={baseHeight}
                    sizes="(min-width: 1024px) 70vw, 100vw"
                    style={{
                      display: "block",
                      maxWidth: "min(1200px, 94vw)",
                      maxHeight: "calc(100vh - 120px)",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                    }}
                    priority
                  />
                </div>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
