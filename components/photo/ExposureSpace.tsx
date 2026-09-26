"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { PhotoEntry, Section } from "@/app/photography/data";
import type { LightboxItem } from "./Lightbox";
import { EASE_OUT, exposureLine, formatShutter, photoTheme } from "./utils";

// ─── Axes ────────────────────────────────────────────────────────────────────
// Each axis maps a photo to a position in 0..1, or null when the frame didn't
// record that value. Camera settings use log scales, so one stop is one step.

interface Axis {
  label: string;
  value: (p: PhotoEntry) => number | null;
  domain: [number, number];
  ticks: [number, string][];
}

const log2 = Math.log2;

function hexHsl(hex: string): { h: number; s: number } {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return { h: 0, s: 0 };
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return { h: h < 0 ? h + 360 : h, s: d / (1 - Math.abs(max + min - 1) || 1) };
}

/** Most saturated colour in the palette, which says more about a photo than its average. */
function signature(p: PhotoEntry): string {
  const colors = p.palette.length ? p.palette : [p.color];
  return colors.reduce((best, c) => (hexHsl(c).s > hexHsl(best).s ? c : best), colors[0]);
}

/** Mean brightness from the luminance histogram, 0..1. */
function brightness(p: PhotoEntry): number | null {
  const l = p.hist.l;
  if (!l.length) return null;
  // Bins are sqrt-normalised; square them back to counts before averaging
  const w = l.map((v) => v * v);
  const total = w.reduce((a, b) => a + b, 0) || 1;
  return w.reduce((acc, v, i) => acc + v * ((i + 0.5) / l.length), 0) / total;
}

const AXES: Record<string, Axis> = {
  shutter: {
    label: "Shutter speed",
    value: (p) => (p.exif.shutter ? log2(p.exif.shutter) : null),
    domain: [log2(1 / 8000), log2(30)],
    ticks: [1 / 8000, 1 / 1000, 1 / 125, 1 / 15, 1, 8].map((v) => [log2(v), formatShutter(v)!]),
  },
  aperture: {
    label: "Aperture",
    value: (p) => (p.exif.aperture ? log2(p.exif.aperture) : null),
    domain: [log2(1.2), log2(24)],
    ticks: [1.4, 2.8, 5.6, 11, 22].map((v) => [log2(v), `ƒ/${v}`]),
  },
  focal: {
    label: "Focal length",
    value: (p) => (p.exif.focal ? log2(p.exif.focal) : null),
    domain: [log2(20), log2(260)],
    ticks: [24, 35, 50, 70, 135, 200].map((v) => [log2(v), `${v}mm`]),
  },
  iso: {
    label: "ISO",
    value: (p) => (p.exif.iso ? log2(p.exif.iso) : null),
    domain: [log2(50), log2(12800)],
    ticks: [100, 400, 1600, 6400].map((v) => [log2(v), String(v)]),
  },
  hue: {
    label: "Colour",
    value: (p) => hexHsl(signature(p)).h,
    domain: [0, 360],
    ticks: [
      [0, "Red"],
      [60, "Yellow"],
      [120, "Green"],
      [210, "Blue"],
      [300, "Magenta"],
    ],
  },
  brightness: {
    label: "Brightness",
    value: brightness,
    domain: [0.05, 0.8],
    ticks: [
      [0.1, "Dark"],
      [0.4, "Mid"],
      [0.7, "Bright"],
    ],
  },
};

const VIEWS = [
  { id: "exposure", name: "Shutter × Aperture", x: "shutter", y: "aperture" },
  { id: "lens", name: "Focal × ISO", x: "focal", y: "iso" },
  { id: "colour", name: "Colour × Brightness", x: "hue", y: "brightness" },
] as const;

const CHAPTER_COLORS = ["#e0708f", "#6fbf73", "#8a94ff", "#f0b04a", "#4cc3d9", "#c98af0"];

// Deterministic jitter so frames with identical settings fan out instead of stacking
function jitter(i: number, axis: number): number {
  const s = Math.sin(i * 12.9898 + axis * 78.233) * 43758.5453;
  return (s - Math.floor(s) - 0.5) * 0.045;
}

export default function ExposureSpace({
  sections,
  isDark,
  onOpen,
}: {
  sections: Section[];
  isDark: boolean;
  onOpen: (items: LightboxItem[], index: number, rect: DOMRect) => void;
}) {
  const t = photoTheme(isDark);
  const plotRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("exposure");
  const [hover, setHover] = useState<number | null>(null);
  const [only, setOnly] = useState<string | null>(null);

  const items = useMemo<(LightboxItem & { chapter: number })[]>(
    () => sections.flatMap((s, chapter) => s.photos.map((photo) => ({ photo, sectionId: s.id, sectionTitle: s.title, chapter }))),
    [sections],
  );

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const v = VIEWS.find((x) => x.id === view)!;
  const ax = AXES[v.x];
  const ay = AXES[v.y];
  const norm = (a: Axis, val: number) => (val - a.domain[0]) / (a.domain[1] - a.domain[0]);
  const mobile = size.w > 0 && size.w < 600;
  const thumb = mobile ? 24 : 40;

  const points = items.map((it, i) => {
    const xv = ax.value(it.photo);
    const yv = ay.value(it.photo);
    if (xv === null || yv === null) return null;
    const x = Math.min(1, Math.max(0, norm(ax, xv) + jitter(i, 1)));
    const y = Math.min(1, Math.max(0, norm(ay, yv) + jitter(i, 2)));
    return { x: x * size.w, y: (1 - y) * size.h };
  });
  const plotted = points.filter(Boolean).length;
  const hovered = hover !== null ? items[hover] : null;
  const hp = hover !== null ? points[hover] : null;

  const mono: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  };
  const chip = (active: boolean): React.CSSProperties => ({
    ...mono,
    fontSize: 9,
    padding: "10px 14px",
    borderRadius: 999,
    border: `1px solid ${active ? t.ink : t.rule}`,
    background: active ? t.ink : "transparent",
    color: active ? t.bg : t.ink,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <section
      aria-label="Exposure space"
      // Clip horizontally: an enlarged thumbnail at the plot edge must not widen the page
      style={{ padding: "clamp(90px, 16vh, 180px) clamp(16px, 5vw, 72px) 0", maxWidth: 1400, margin: "0 auto", overflowX: "clip" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: "clamp(24px, 4vw, 40px)" }}>
        <div style={{ ...mono, fontSize: 9.5, color: t.sub, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 28, height: 1, background: t.rule }} />
          Exposure space
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-elevated)",
            fontWeight: 300,
            fontSize: "clamp(1.8rem, 4.4vw, 3.4rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            color: t.ink,
            maxWidth: "18em",
          }}
        >
          Every frame, plotted by how it was made.{" "}
          <span style={{ color: t.faint }}>Positions come from the camera data inside each file.</span>
        </h2>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {VIEWS.map((x) => (
            <button key={x.id} type="button" onClick={() => setView(x.id)} aria-pressed={view === x.id} style={chip(view === x.id)}>
              {x.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gridTemplateRows: "1fr auto", gap: 10 }}>
        {/* Y axis */}
        <div style={{ position: "relative", width: mobile ? 34 : 56 }}>
          {ay.ticks.map(([val, label]) => (
            <span
              key={label}
              style={{
                ...mono,
                letterSpacing: "0.06em",
                position: "absolute",
                right: 0,
                top: `${(1 - norm(ay, val)) * 100}%`,
                transform: "translateY(-50%)",
                fontSize: mobile ? 8 : 9.5,
                color: t.sub,
                whiteSpace: "nowrap",
                transition: "top 0.9s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Plot */}
        <div
          ref={plotRef}
          onPointerLeave={() => setHover(null)}
          style={{
            position: "relative",
            height: mobile ? "min(110vw, 520px)" : "clamp(420px, 62vh, 640px)",
            borderRadius: 14,
            border: `1px solid ${t.rule}`,
            background: isDark ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.5)",
          }}
        >
          {/* Grid lines at the ticks */}
          {ax.ticks.map(([val]) => (
            <span
              key={`x${val}`}
              aria-hidden
              style={{ position: "absolute", top: 0, bottom: 0, width: 1, left: `${norm(ax, val) * 100}%`, background: t.rule }}
            />
          ))}
          {ay.ticks.map(([val]) => (
            <span
              key={`y${val}`}
              aria-hidden
              style={{ position: "absolute", left: 0, right: 0, height: 1, top: `${(1 - norm(ay, val)) * 100}%`, background: t.rule }}
            />
          ))}

          {/* Crosshair to the axes for the hovered frame */}
          {hp && (
            <>
              <span
                aria-hidden
                style={{ position: "absolute", top: hp.y, left: 0, width: hp.x, height: 1, background: t.accent, opacity: 0.6 }}
              />
              <span
                aria-hidden
                style={{ position: "absolute", left: hp.x, top: hp.y, bottom: 0, width: 1, background: t.accent, opacity: 0.6 }}
              />
            </>
          )}

          {size.w > 0 &&
            items.map((it, i) => {
              const pt = points[i];
              const visible = !!pt && (only === null || only === it.sectionId);
              const isHover = hover === i;
              return (
                <button
                  key={it.photo.src}
                  type="button"
                  data-af={exposureLine(it.photo.exif) || it.sectionTitle}
                  aria-label={`Open ${it.sectionTitle} photograph`}
                  tabIndex={visible ? 0 : -1}
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onClick={(e) => {
                    const list = items.filter((_, k) => points[k] && (only === null || only === items[k].sectionId));
                    onOpen(list, list.indexOf(it), e.currentTarget.getBoundingClientRect());
                  }}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: thumb,
                    height: thumb,
                    padding: 0,
                    borderRadius: 6,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: it.photo.color,
                    border: `2px solid ${CHAPTER_COLORS[it.chapter % CHAPTER_COLORS.length]}`,
                    // Positions animate on the compositor; each frame leaves a moment after the last
                    transform: `translate(${(pt?.x ?? size.w / 2) - thumb / 2}px, ${(pt?.y ?? size.h / 2) - thumb / 2}px) scale(${
                      visible ? (isHover ? (mobile ? 2.2 : 3) : 1) : 0
                    })`,
                    opacity: visible ? (hover !== null && !isHover ? 0.55 : 1) : 0,
                    zIndex: isHover ? 20 : 1,
                    transition: `transform 0.9s cubic-bezier(0.22,1,0.36,1) ${isHover ? 0 : (i % 27) * 12}ms, opacity 0.4s ease`,
                    boxShadow: isHover ? "0 10px 30px rgba(0,0,0,0.45)" : "none",
                    pointerEvents: visible ? "auto" : "none",
                  }}
                >
                  <Image src={it.photo.src} alt="" fill sizes="120px" style={{ objectFit: "cover" }} />
                </button>
              );
            })}

          {/* Readout for the hovered frame */}
          {hovered && hp && (
            <motion.div
              key={hover}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              style={{
                ...mono,
                letterSpacing: "0.12em",
                position: "absolute",
                // Phones: span the plot and wrap, so the readout can never push past the screen edge
                ...(mobile
                  ? { left: 8, right: 8, textAlign: "center" as const, whiteSpace: "normal" as const }
                  : { left: Math.min(Math.max(hp.x, 150), size.w - 150), transform: "translateX(-50%)", whiteSpace: "nowrap" as const }),
                top: hp.y > size.h * 0.5 ? 12 : undefined,
                bottom: hp.y <= size.h * 0.5 ? 12 : undefined,
                padding: "8px 12px",
                borderRadius: 10,
                background: t.glass,
                border: `1px solid ${t.rule}`,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                fontSize: 9,
                color: t.ink,
                pointerEvents: "none",
                zIndex: 30,
              }}
            >
              {hovered.sectionTitle} · {exposureLine(hovered.photo.exif) || "No settings recorded"}
            </motion.div>
          )}
        </div>

        <span />
        {/* X axis */}
        <div style={{ position: "relative", height: 22 }}>
          {ax.ticks.map(([val, label]) => (
            <span
              key={label}
              style={{
                ...mono,
                letterSpacing: "0.06em",
                position: "absolute",
                left: `${norm(ax, val) * 100}%`,
                transform: "translateX(-50%)",
                fontSize: mobile ? 8 : 9.5,
                color: t.sub,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginTop: 18, alignItems: "center" }}>
        <div style={{ ...mono, fontSize: 8.5, color: t.faint }}>
          {ax.label} → · {ay.label} ↑ · {plotted} of {items.length} frames
        </div>
        {/* Legend doubles as a chapter filter */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={only === s.id}
              onClick={() => setOnly((o) => (o === s.id ? null : s.id))}
              style={{
                ...mono,
                fontSize: 8.5,
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 11px",
                borderRadius: 999,
                border: `1px solid ${only === s.id ? t.ink : t.rule}`,
                background: "transparent",
                color: only === null || only === s.id ? t.ink : t.faint,
                cursor: "pointer",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 2, background: CHAPTER_COLORS[i % CHAPTER_COLORS.length] }} />
              {s.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
