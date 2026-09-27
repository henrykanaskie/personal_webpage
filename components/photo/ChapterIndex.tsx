"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useInView } from "framer-motion";
import type { Section } from "@/app/photography/data";
import { EASE_OUT, aspect, frameClock, pad2, photoTheme, smoothing } from "./utils";

const PREVIEW_W = 300;

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

  // Pointer position is tracked cheaply at all times; the animation loop only runs while a row is hovered
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Floating preview follows the pointer with lag and velocity skew
  const hovering = hovered !== null;
  useEffect(() => {
    if (!finePointer || !hovering) return;
    const pos = { ...pointer.current };
    let raf = 0;
    const clock = frameClock();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const k = smoothing(0.12, clock(now));
      const dx = pointer.current.x - pos.x;
      const dy = pointer.current.y - pos.y;
      pos.x += dx * k;
      pos.y += dy * k;
      const el = floatRef.current;
      if (!el) return;
      const skew = Math.max(-14, Math.min(14, dx * 0.08));
      const rot = Math.max(-8, Math.min(8, dx * 0.03));
      el.style.transform = `translate3d(${pos.x + 36}px, ${pos.y - 120}px, 0) rotate(${rot}deg) skewX(${-skew}deg)`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [finePointer, hovering]);

  const mono: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  };

  const hoveredSection = hovered !== null ? live[hovered] : null;
  const stack = hoveredSection ? [0, 1, 2].map((k) => hoveredSection.photos[(frame + k) % hoveredSection.photos.length]) : [];

  return (
    <section
      id="chapters"
      aria-label="Chapters"
      style={{
        position: "relative",
        padding: "clamp(80px, 14vh, 160px) clamp(18px, 5vw, 72px) clamp(60px, 10vh, 120px)",
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
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
                data-af=""
                onPointerEnter={() => setHovered(i)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                style={{
                  display: "grid",
                  gridTemplateColumns: narrow ? "28px 1fr auto" : "clamp(34px, 6vw, 90px) 1fr auto",
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
                      letterSpacing: "-0.03em",
                      transform: hovered === i ? "translateX(clamp(6px, 1.5vw, 22px))" : "none",
                      transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {section.title}
                  </span>
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
                <span style={{ ...mono, fontSize: 9, color: t.faint, fontVariantNumeric: "tabular-nums" }}>
                  {pad2(section.photos.length)}
                </span>
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
