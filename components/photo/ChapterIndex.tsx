"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useInView } from "framer-motion";
import type { Section } from "@/app/photography/data";
import { EASE_OUT, aspect, pad2, photoTheme } from "./utils";

const PREVIEW_W = 300;

function yearSpan(section: Section): string {
  const years = section.photos
    .map((p) => p.exif.date?.slice(0, 4))
    .filter(Boolean)
    .sort() as string[];
  if (years.length === 0) return "";
  const [a, b] = [years[0], years[years.length - 1]];
  return a === b ? a : `${a}-${b.slice(2)}`;
}

/**
 * Chapter list. Hovering a row summons a floating stack of that chapter's
 * prints which trails the pointer, leans into its velocity and shuffles
 * through frames. On touch screens each row carries a small contact strip instead.
 */
export default function ChapterIndex({ sections, isDark }: { sections: Section[]; isDark: boolean }) {
  const t = photoTheme(isDark);
  const listRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const inView = useInView(listRef, { once: true, margin: "-10% 0px" });
  const [hovered, setHovered] = useState<number | null>(null);
  const [frame, setFrame] = useState(0);
  const [finePointer, setFinePointer] = useState(true);
  const [narrow, setNarrow] = useState(false);
  const live = sections.filter((s) => s.photos.length > 0);

  useEffect(() => {
    setFinePointer(window.matchMedia("(pointer: fine)").matches);
    const check = () => setNarrow(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Shuffle frames while a row is hovered
  useEffect(() => {
    if (hovered === null) return;
    setFrame(0);
    const id = setInterval(() => setFrame((f) => f + 1), 850);
    return () => clearInterval(id);
  }, [hovered]);

  // Floating preview follows the pointer with lag and velocity skew
  useEffect(() => {
    if (!finePointer) return;
    const pos = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      pos.x += dx * 0.12;
      pos.y += dy * 0.12;
      const el = floatRef.current;
      if (!el) return;
      const skew = Math.max(-14, Math.min(14, dx * 0.08));
      const rot = Math.max(-8, Math.min(8, dx * 0.03));
      el.style.transform = `translate3d(${pos.x + 36}px, ${pos.y - 120}px, 0) rotate(${rot}deg) skewX(${-skew}deg)`;
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [finePointer]);

  const mono: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  };

  const hoveredSection = hovered !== null ? live[hovered] : null;
  const stack = hoveredSection ? [0, 1, 2].map((k) => hoveredSection.photos[(frame + k) % hoveredSection.photos.length]) : [];

  return (
    <section
      aria-label="Chapters"
      style={{
        position: "relative",
        padding: "clamp(80px, 14vh, 160px) clamp(18px, 5vw, 72px) clamp(60px, 10vh, 120px)",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      <div style={{ ...mono, fontSize: 9.5, color: t.sub, display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
        <span>Index</span>
        <span>{live.reduce((n, s) => n + s.photos.length, 0)} frames</span>
      </div>

      <div ref={listRef} onPointerLeave={() => setHovered(null)}>
        {live.map((section, i) => {
          const dim = hovered !== null && hovered !== i;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: i * 0.08, ease: EASE_OUT }}
              style={{ borderTop: `1px solid ${t.rule}`, ...(i === live.length - 1 ? { borderBottom: `1px solid ${t.rule}` } : {}) }}
            >
              <Link
                href={`/photography/${section.id}`}
                data-af={`${section.photos.length} frames`}
                onPointerEnter={() => setHovered(i)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                style={{
                  display: "grid",
                  gridTemplateColumns: narrow ? "28px 1fr" : "clamp(34px, 6vw, 90px) 1fr auto",
                  alignItems: "center",
                  gap: "clamp(10px, 2vw, 28px)",
                  padding: "clamp(14px, 2.4vw, 26px) 0",
                  textDecoration: "none",
                  color: t.ink,
                  opacity: dim ? 0.28 : 1,
                  transition: "opacity 0.5s ease",
                }}
              >
                <span style={{ ...mono, fontSize: 10, color: t.faint }}>{section.num}</span>
                <span style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-elevated)",
                      fontWeight: 300,
                      fontSize: "clamp(1.9rem, 7.5vw, 6.5rem)",
                      lineHeight: 0.95,
                      letterSpacing: hovered === i ? "0.01em" : "-0.03em",
                      transform: hovered === i ? "translateX(clamp(6px, 1.5vw, 22px))" : "none",
                      transition: "letter-spacing 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {section.title}
                  </span>
                  {narrow && (
                    <span style={{ ...mono, fontSize: 8.5, color: t.sub }}>
                      {section.sub} · {pad2(section.photos.length)} · {yearSpan(section)}
                    </span>
                  )}
                  {!finePointer && (
                    <span style={{ display: "flex", gap: 4, overflow: "hidden" }}>
                      {section.photos.slice(0, 6).map((p) => (
                        <span
                          key={p.src}
                          style={{
                            position: "relative",
                            height: 38,
                            width: Math.round(38 * aspect(p)),
                            flexShrink: 0,
                            background: p.color,
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          <Image src={p.src} alt="" fill sizes="80px" style={{ objectFit: "cover" }} />
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                {!narrow && (
                  <span style={{ ...mono, fontSize: 9, color: t.sub, textAlign: "right", lineHeight: 2 }}>
                    <span style={{ display: "block" }}>{section.sub}</span>
                    <span style={{ display: "block", color: t.faint }}>
                      {pad2(section.photos.length)} · {yearSpan(section)}
                    </span>
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Floating preview stack */}
      {finePointer && (
        <div
          ref={floatRef}
          aria-hidden
          style={{ position: "fixed", left: 0, top: 0, width: PREVIEW_W, zIndex: 40, pointerEvents: "none", willChange: "transform" }}
        >
          <AnimatePresence>
            {stack.map((p, k) => (
              <motion.div
                key={`${hovered}-${p.src}`}
                initial={{ opacity: 0, scale: 0.7, rotate: -6, y: 30, clipPath: "inset(50% 50% 50% 50%)" }}
                animate={{
                  opacity: 1 - k * 0.25,
                  scale: 1 - k * 0.08,
                  rotate: (k - 1) * 5,
                  y: -k * 16,
                  x: k * 18,
                  clipPath: "inset(0% 0% 0% 0%)",
                }}
                exit={{ opacity: 0, scale: 0.85, clipPath: "inset(50% 50% 50% 50%)", transition: { duration: 0.35 } }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: PREVIEW_W,
                  aspectRatio: String(aspect(p)),
                  maxHeight: 360,
                  zIndex: 3 - k,
                  overflow: "hidden",
                  borderRadius: 3,
                  background: p.color,
                  boxShadow: `0 30px 60px -20px ${p.color}cc`,
                }}
              >
                <Image src={p.src} alt="" fill sizes={`${PREVIEW_W}px`} style={{ objectFit: "cover" }} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
