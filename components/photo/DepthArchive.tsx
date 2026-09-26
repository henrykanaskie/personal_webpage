"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion, useScroll } from "framer-motion";
import type { Section } from "@/app/photography/data";
import type { LightboxItem } from "./Lightbox";
import { aspect, exposureLine, frameClock, pad2, photoTheme, rgbTriplet, smoothing } from "./utils";

const SPACING = 760; // world units between planes
const FAR = 5200; // planes further than this are fully fogged
const SCROLL_PER_UNIT = 0.42; // page px of scroll per world unit travelled

type Plane =
  | { kind: "chapter"; z: number; section: Section }
  | { kind: "photo"; z: number; item: LightboxItem; archiveIndex: number; x: number; y: number; w: number };

// Positions cycle around the tunnel wall so consecutive photos never overlap
const SLOTS: [number, number][] = [
  [-0.3, -0.12],
  [0.32, 0.1],
  [-0.22, 0.2],
  [0.26, -0.18],
  [-0.34, 0.04],
  [0.18, 0.22],
];

/**
 * "The Archive": a scroll-driven flight through a tunnel of prints. The page
 * scroll moves the camera along the z axis; chapter titles hang in space ahead
 * of each category, prints emerge from fog and slide past, and the room light
 * takes on the colour of whichever print is closest. The pointer steers the
 * camera slightly for parallax.
 */
export default function DepthArchive({
  sections,
  perSection,
  isDark,
  onOpen,
}: {
  sections: Section[];
  perSection: number;
  isDark: boolean;
  onOpen: (items: LightboxItem[], index: number, rect: DOMRect) => void;
}) {
  const t = photoTheme(isDark);
  const outerRef = useRef<HTMLElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const planeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gaugeRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const reduceMotion = !!useReducedMotion();
  const { scrollYProgress } = useScroll({ target: outerRef, offset: ["start start", "end end"] });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { planes, items } = useMemo(() => {
    const planes: Plane[] = [];
    const items: LightboxItem[] = [];
    let z = SPACING * 1.4;
    let slot = 0;
    for (const section of sections) {
      if (section.photos.length === 0) continue;
      planes.push({ kind: "chapter", z, section });
      z += SPACING * 1.15;
      // Spread picks across the whole folder rather than taking the first few
      const n = Math.min(perSection, section.photos.length);
      for (let k = 0; k < n; k++) {
        const photo = section.photos[Math.floor((k * section.photos.length) / n)];
        const item = { photo, sectionId: section.id, sectionTitle: section.title };
        const [x, y] = SLOTS[slot++ % SLOTS.length];
        const ar = aspect(photo);
        planes.push({ kind: "photo", z, item, archiveIndex: items.length, x, y, w: ar >= 1 ? 1 : 0.62 });
        items.push(item);
        z += SPACING;
      }
      z += SPACING * 0.4;
    }
    return { planes, items };
  }, [sections, perSection]);

  const depth = planes.length ? planes[planes.length - 1].z + SPACING * 0.6 : 0;

  // Camera loop: one transform per plane per frame, no React renders
  useEffect(() => {
    let raf = 0;
    let camZ = 0;
    const look = { x: 0, y: 0 };
    const lookTarget = { x: 0, y: 0 };
    let lastNear = -1;

    const onMove = (e: PointerEvent) => {
      lookTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
      lookTarget.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const clock = frameClock();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = clock(now);
      const target = scrollYProgress.get() * depth;
      // Eased camera so fast scroll-wheel steps glide instead of jumping
      camZ += (target - camZ) * (reduceMotion ? 1 : smoothing(0.09, dt));
      const kl = reduceMotion ? 0 : smoothing(0.05, dt);
      look.x += (lookTarget.x - look.x) * kl;
      look.y += (lookTarget.y - look.y) * kl;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 768;
      if (worldRef.current) {
        worldRef.current.style.transform = `rotateY(${look.x * 3.5}deg) rotateX(${-look.y * 2.5}deg)`;
      }

      let best = Infinity;
      let bestIdx = 0;
      planes.forEach((p, i) => {
        const el = planeRefs.current[i];
        if (!el) return;
        const rel = p.z - camZ;
        // Fog in from far away; fade out just before the plane reaches the lens
        let o = rel > FAR ? 0 : rel > FAR * 0.55 ? 1 - (rel - FAR * 0.55) / (FAR * 0.45) : 1;
        // Prints sweep past the lens; chapter titles clear out earlier so they never smear across the frame
        if (p.kind === "photo" && rel < 260) o *= Math.max(0, (rel + 160) / 420);
        if (p.kind === "chapter" && rel < 900) o *= Math.max(0, (rel - 150) / 750);
        if (o <= 0.001) {
          if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
          return;
        }
        el.style.visibility = "visible";
        el.style.opacity = o.toFixed(3);
        const x = p.kind === "photo" ? p.x * vw * (mobile ? 0.45 : 1) : 0;
        const y = p.kind === "photo" ? p.y * vh * (mobile ? 0.9 : 1) : 0;
        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${(-rel).toFixed(1)}px)`;
        el.style.pointerEvents = p.kind === "photo" && rel < 1800 && rel > 0 ? "auto" : "none";
        if (p.kind === "photo" && rel > 0 && rel < best) {
          best = rel;
          bestIdx = p.archiveIndex;
        }
      });
      if (bestIdx !== lastNear) {
        lastNear = bestIdx;
        setNear(bestIdx);
      }
      if (gaugeRef.current) gaugeRef.current.style.transform = `scaleY(${Math.min(1, camZ / depth)})`;
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [planes, depth, scrollYProgress, reduceMotion]);

  const nearItem = items[near];
  const glow = nearItem ? rgbTriplet(nearItem.photo.palette[1] ?? nearItem.photo.color) : "120,120,160";
  const mono: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  };

  return (
    <section
      ref={outerRef}
      aria-label="The archive: a walk through selected photographs"
      style={{ position: "relative", height: `calc(${Math.round(depth * SCROLL_PER_UNIT)}px + 100vh)` }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100svh",
          overflow: "hidden",
          perspective: isMobile ? 700 : 1000,
          perspectiveOrigin: "50% 50%",
        }}
      >
        {/* Room light follows the closest print */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(70% 60% at 50% 50%, rgba(${glow},${isDark ? 0.2 : 0.16}), transparent 70%)`,
            transition: "background 1.2s ease",
          }}
        />
        {/* Tunnel rings: faint concentric guides that sell the depth */}
        <svg
          aria-hidden
          viewBox="-100 -100 200 200"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: isDark ? 0.5 : 0.7 }}
        >
          {[18, 34, 56, 86, 130].map((r) => (
            <rect key={r} x={-r * 1.6} y={-r} width={r * 3.2} height={r * 2} fill="none" stroke={t.rule} strokeWidth="0.25" />
          ))}
          {[
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
          ].map(([sx, sy]) => (
            <line key={`${sx}${sy}`} x1={sx * 18 * 1.6} y1={sy * 18} x2={sx * 208} y2={sy * 130} stroke={t.rule} strokeWidth="0.25" />
          ))}
        </svg>

        <div ref={worldRef} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
          {planes.map((p, i) =>
            p.kind === "chapter" ? (
              <div
                key={`c-${p.section.id}`}
                ref={(el) => {
                  planeRefs.current[i] = el;
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  textAlign: "center",
                  visibility: "hidden",
                  willChange: "transform, opacity",
                }}
              >
                <div style={{ ...mono, fontSize: 11, color: t.sub, marginBottom: 14 }}>
                  Chapter {p.section.num} · {p.section.photos.length} frames
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-elevated)",
                    fontWeight: 300,
                    fontSize: "clamp(3rem, 11vw, 10rem)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.03em",
                    color: t.ink,
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.section.title}
                </div>
                <div style={{ ...mono, fontSize: 10, color: t.faint, marginTop: 16 }}>{p.section.sub}</div>
              </div>
            ) : (
              <div
                key={`p-${p.item.photo.src}`}
                ref={(el) => {
                  planeRefs.current[i] = el;
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: `calc(${p.w} * ${isMobile ? "84vw" : "clamp(260px, 30vw, 520px)"})`,
                  visibility: "hidden",
                  willChange: "transform, opacity",
                }}
              >
                <button
                  type="button"
                  data-af={exposureLine(p.item.photo.exif)}
                  aria-label={`Open ${p.item.sectionTitle} photograph`}
                  onClick={(e) => onOpen(items, p.archiveIndex, e.currentTarget.getBoundingClientRect())}
                  style={{
                    display: "block",
                    position: "relative",
                    width: "100%",
                    aspectRatio: String(aspect(p.item.photo)),
                    padding: 0,
                    border: "none",
                    cursor: "pointer",
                    background: p.item.photo.blur
                      ? `center / cover no-repeat url(${p.item.photo.blur}), ${p.item.photo.color}`
                      : p.item.photo.color,
                    boxShadow: `0 40px 90px -30px rgba(${rgbTriplet(p.item.photo.color)},0.55), 0 0 0 1px ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                  }}
                >
                  <Image
                    src={p.item.photo.src}
                    alt={`${p.item.sectionTitle} photograph`}
                    fill
                    sizes="(min-width: 768px) 32vw, 60vw"
                    style={{ objectFit: "cover" }}
                  />
                </button>
                <div
                  style={{
                    ...mono,
                    fontSize: 8.5,
                    color: t.faint,
                    marginTop: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span>
                    {p.item.sectionTitle} · {pad2(p.archiveIndex + 1)}
                  </span>
                  <span>{p.item.photo.exif.date?.slice(0, 4) ?? ""}</span>
                </div>
              </div>
            ),
          )}
        </div>

        {/* Depth gauge */}
        <div
          aria-hidden
          style={{
            ...mono,
            position: "absolute",
            right: "clamp(14px, 3vw, 36px)",
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 12,
            fontSize: 8.5,
            color: t.sub,
          }}
        >
          <span>Depth</span>
          <div style={{ width: 1, height: "28vh", background: t.rule, position: "relative" }}>
            <div
              ref={gaugeRef}
              style={{ position: "absolute", inset: 0, background: t.ink, transformOrigin: "top", transform: "scaleY(0)" }}
            />
          </div>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {pad2(near + 1)} / {pad2(items.length)}
          </span>
        </div>

        <div
          aria-hidden
          style={{
            ...mono,
            position: "absolute",
            left: "clamp(18px, 5vw, 72px)",
            top: "clamp(90px, 13vh, 130px)",
            fontSize: 9,
            color: t.sub,
            lineHeight: 2,
          }}
        >
          <div style={{ color: t.ink }}>The Archive</div>
          <div>{nearItem?.sectionTitle}</div>
          <div style={{ color: t.faint }}>{nearItem ? exposureLine(nearItem.photo.exif) : ""}</div>
        </div>

        {/* The walk is long by design; let visitors in a hurry jump past it */}
        <button
          type="button"
          onClick={() => document.getElementById("chapters")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })}
          style={{
            ...mono,
            position: "absolute",
            left: "50%",
            bottom: "calc(clamp(20px, 4vh, 40px) + env(safe-area-inset-bottom))",
            transform: "translateX(-50%)",
            fontSize: 9,
            color: t.ink,
            padding: "11px 18px",
            borderRadius: 999,
            border: `1px solid ${t.rule}`,
            background: t.glass,
            backdropFilter: "blur(14px) saturate(1.4)",
            WebkitBackdropFilter: "blur(14px) saturate(1.4)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Skip to chapters ↓
        </button>
      </div>
    </section>
  );
}
