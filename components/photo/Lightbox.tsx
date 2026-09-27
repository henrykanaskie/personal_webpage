"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { PhotoEntry } from "@/app/photography/data";
import { shutter } from "./feedback";
import FadeImage from "./FadeImage";
import {
  EASE_OUT,
  aspect,
  cameraName,
  formatAperture,
  formatFocal,
  formatShutter,
  pad2,
  photoTheme,
  rgbTriplet,
  signalLightbox,
} from "./utils";

export interface LightboxItem {
  photo: PhotoEntry;
  sectionId: string;
  sectionTitle: string;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const LOUPE_SIZE = 220;
const PANEL_W = 320;
const STRIP_H = 92;
const SHEET_VH = 0.44;

function fitBox(ratio: number, panelOpen: boolean): Box {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const desktop = vw >= 1024;
  const panel = desktop && panelOpen ? PANEL_W : 0;
  const margin = desktop ? 84 : 12;
  const top = desktop ? 40 : 64;
  const availW = vw - panel - margin * 2;
  // On phones the info sheet slides up from the bottom, so the photo moves up to sit above it
  const sheet = !desktop && panelOpen ? Math.round(vh * SHEET_VH) : 0;
  const availH = vh - top - STRIP_H - (desktop ? 12 : 8) - sheet;
  let width = availW;
  let height = width / ratio;
  if (height > availH) {
    height = availH;
    width = height * ratio;
  }
  return {
    left: margin + (availW - width) / 2,
    top: top + (availH - height) / 2,
    width,
    height,
  };
}

function toBox(r: DOMRect): Box {
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/**
 * Full-screen viewer. Opens by morphing out of the clicked thumbnail, lights the
 * room with the photo's own colours, and exposes the build-time analysis:
 * camera settings and palette. Click the image for a magnifying loupe.
 */
export default function Lightbox({
  items,
  index,
  origin,
  isDark,
  onIndex,
  onClose,
}: {
  items: LightboxItem[];
  index: number;
  origin: DOMRect | null;
  isDark: boolean;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const t = photoTheme(isDark);
  const item = items[index];
  const { photo } = item;
  const ratio = aspect(photo);

  // Photo details are opt-in: the photo gets the whole stage until the visitor asks for info
  const [panelOpen, setPanelOpen] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  const [loupe, setLoupe] = useState(false);
  const [zoom, setZoom] = useState(2.6);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const [isDesktop, setIsDesktop] = useState(true);
  const stripRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Start at the thumbnail's rect so the first animation grows out of it
  const initialBox = useRef<Box | null>(origin ? toBox(origin) : null);

  useLayoutEffect(() => {
    const update = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setBox(fitBox(ratio, panelOpen));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ratio, panelOpen]);

  // Shutter click on open and on every frame change (silent unless the visitor opted in)
  useEffect(() => {
    shutter();
  }, [index]);

  const go = useCallback(
    (delta: number) => {
      const next = index + delta;
      if (next < 0 || next >= items.length) return;
      setDirection(delta);
      setLoupe(false);
      onIndex(next);
    },
    [index, items.length, onIndex],
  );

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    signalLightbox(true);
    return () => {
      document.body.style.overflow = originalOverflow;
      signalLightbox(false);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "i" || e.key === "I") setPanelOpen((p) => !p);
      else if (e.key === "z" || e.key === "Z") setLoupe((l) => !l);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // Keep the active thumbnail centred in the strip
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[index] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    strip.scrollTo({ left: thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2, behavior: "smooth" });
  }, [index]);

  const copy = (hex: string) => {
    navigator.clipboard?.writeText(hex).catch(() => {});
    setCopied(hex);
    setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1200);
  };

  const glow = rgbTriplet(photo.palette[1] ?? photo.color);
  const glow2 = rgbTriplet(photo.palette[0] ?? photo.color);
  const exif = photo.exif;
  const stats: [string, string | undefined][] = [
    ["Focal", formatFocal(exif.focal)],
    ["Aperture", formatAperture(exif.aperture)],
    ["Shutter", formatShutter(exif.shutter)],
    ["ISO", exif.iso ? String(exif.iso) : undefined],
  ];

  const mono: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  };

  const roundBtn: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${t.rule}`,
    background: t.glass,
    backdropFilter: "blur(14px) saturate(1.4)",
    WebkitBackdropFilter: "blur(14px) saturate(1.4)",
    color: t.ink,
    cursor: "pointer",
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.sectionTitle} photo ${index + 1} of ${items.length}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      transition={{ duration: 0.4 }}
      style={{ position: "fixed", inset: 0, zIndex: 70, overflow: "hidden" }}
      onClick={onClose}
      onTouchStart={(e) => {
        // Gestures that begin on the filmstrip or the info sheet scroll those, not the viewer
        if ((e.target as Element).closest("[data-own-gestures]")) {
          touchStart.current = null;
          return;
        }
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const s = touchStart.current;
        touchStart.current = null;
        if (!s) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        else if (dy > 90) onClose();
      }}
    >
      {/* Room light: the photo's own colours bleed into the backdrop */}
      <div style={{ position: "absolute", inset: 0, background: isDark ? "rgba(4,4,7,0.94)" : "rgba(246,242,236,0.95)" }} />
      <AnimatePresence initial={false}>
        <motion.div
          key={photo.src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          aria-hidden
          style={{
            position: "absolute",
            inset: "-10%",
            backgroundImage: photo.blur ? `url(${photo.blur})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(70px) saturate(1.6)",
            opacity: isDark ? 0.26 : 0.4,
          }}
        />
      </AnimatePresence>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(60% 50% at 40% 45%, rgba(${glow},${isDark ? 0.16 : 0.1}), transparent 70%), radial-gradient(40% 40% at 80% 90%, rgba(${glow2},${isDark ? 0.1 : 0.08}), transparent 70%), radial-gradient(120% 90% at 50% 50%, transparent 55%, ${isDark ? "rgba(0,0,0,0.65)" : "rgba(120,100,90,0.18)"} 100%)`,
          transition: "background 0.8s ease",
        }}
      />

      {/* The print */}
      {box && (
        <motion.div
          initial={initialBox.current ? { ...initialBox.current } : { ...box, opacity: 0, scale: 0.94 }}
          animate={{ ...box, opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 170, damping: 26, mass: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            if (isDesktop) setLoupe((l) => !l);
          }}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setPointer({ x: e.clientX - r.left, y: e.clientY - r.top });
          }}
          onMouseLeave={() => setPointer(null)}
          onWheel={(e) => {
            if (!loupe) return;
            setZoom((z) => Math.min(6, Math.max(1.5, z - e.deltaY * 0.004)));
          }}
          style={{
            position: "absolute",
            cursor: isDesktop ? (loupe ? "none" : "zoom-in") : "default",
            boxShadow: isDark
              ? `0 40px 120px -20px rgba(${glow2},0.35), 0 0 0 1px rgba(255,255,255,0.06)`
              : `0 40px 100px -30px rgba(${glow2},0.45), 0 0 0 1px rgba(0,0,0,0.06)`,
            background: photo.color,
          }}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={photo.src}
              custom={direction}
              // Slide and fade only: animating a blur filter on a full-size photo repaints it every frame
              initial={{ opacity: 0, x: direction * 48, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -48, scale: 0.985 }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              style={{ position: "absolute", inset: 0, overflow: "hidden" }}
            >
              <FadeImage
                src={photo.src}
                alt={photo.alt ?? `${item.sectionTitle} photograph ${index + 1}`}
                fill
                sizes="(min-width: 1024px) 75vw, 100vw"
                quality={90}
                style={{ objectFit: "cover" }}
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* Magnifying loupe: samples the full-resolution original */}
          <AnimatePresence>
            {loupe && pointer && box && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: "absolute",
                  left: pointer.x - LOUPE_SIZE / 2,
                  top: pointer.y - LOUPE_SIZE / 2,
                  width: LOUPE_SIZE,
                  height: LOUPE_SIZE,
                  borderRadius: "50%",
                  pointerEvents: "none",
                  backgroundImage: `url("${photo.src}")`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${box.width * zoom}px ${box.height * zoom}px`,
                  backgroundPosition: `${-(pointer.x * zoom - LOUPE_SIZE / 2)}px ${-(pointer.y * zoom - LOUPE_SIZE / 2)}px`,
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.5), 0 0 0 6px rgba(10,10,14,0.35), 0 18px 50px rgba(0,0,0,0.55), inset 0 0 30px rgba(0,0,0,0.35)",
                }}
              >
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden>
                  <circle
                    cx="50"
                    cy="50"
                    r="48.5"
                    fill="none"
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="0.4"
                    strokeDasharray="0.6 2.4"
                  />
                  <path d="M50 44v12M44 50h12" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" />
                </svg>
                <span
                  style={{
                    ...mono,
                    position: "absolute",
                    bottom: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 9,
                    color: "#fff",
                    textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                  }}
                >
                  {zoom.toFixed(1)}×
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Warm the cache for the neighbours; same sizes/quality as the main image so the browser picks the same file */}
      <div aria-hidden style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
        {[index - 1, index + 1]
          .filter((i) => i >= 0 && i < items.length)
          .map((i) => (
            <Image
              key={items[i].photo.src}
              src={items[i].photo.src}
              alt=""
              width={items[i].photo.width}
              height={items[i].photo.height}
              sizes="(min-width: 1024px) 75vw, 100vw"
              quality={90}
              loading="eager"
            />
          ))}
      </div>

      {/* Top bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: "max(12px, env(safe-area-inset-top))",
          left: 12,
          right: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            ...mono,
            fontSize: 9,
            color: t.sub,
            display: "flex",
            gap: 12,
            alignItems: "center",
            pointerEvents: "auto",
            minWidth: 0,
            flex: "0 1 auto",
          }}
        >
          <Link
            href={`/photography/${item.sectionId}`}
            style={{
              color: t.ink,
              textDecoration: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {item.sectionTitle}
          </Link>
          <span style={{ width: 18, height: 1, background: t.rule, flexShrink: 0 }} />
          <span style={{ whiteSpace: "nowrap" }}>
            {pad2(index + 1)} / {pad2(items.length)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, pointerEvents: "auto", flexShrink: 0, marginLeft: 8 }}>
          <button
            type="button"
            aria-label="Toggle photo details"
            aria-pressed={panelOpen}
            onClick={() => setPanelOpen((p) => !p)}
            title={panelOpen ? "Hide photo info" : "Show photo info"}
            style={{
              ...roundBtn,
              width: 38,
              height: 38,
              background: panelOpen ? t.ink : t.glass,
              color: panelOpen ? t.bg : t.ink,
              transition: "background 0.25s ease, color 0.25s ease",
            }}
          >
            <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15 }}>i</span>
          </button>
          <button type="button" aria-label="Close photo" onClick={onClose} style={{ ...roundBtn, width: 38, height: 38 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Prev / next */}
      {isDesktop && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            style={{ ...roundBtn, position: "absolute", left: 20, top: "calc(50% - 46px)", opacity: index === 0 ? 0.25 : 1 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.3" fill="none" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next photo"
            disabled={index === items.length - 1}
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            style={{
              ...roundBtn,
              position: "absolute",
              right: 20 + (panelOpen ? PANEL_W : 0),
              top: "calc(50% - 46px)",
              opacity: index === items.length - 1 ? 0.25 : 1,
              transition: "right 0.5s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.3" fill="none" />
            </svg>
          </button>
        </>
      )}

      {/* Data panel: side sheet on desktop, bottom sheet on mobile */}
      <AnimatePresence>
        {panelOpen && (
          <motion.aside
            key="panel"
            data-own-gestures
            onClick={(e) => e.stopPropagation()}
            initial={isDesktop ? { x: PANEL_W, opacity: 0 } : { y: 40, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={isDesktop ? { x: PANEL_W, opacity: 0 } : { y: 40, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            style={{
              position: "absolute",
              ...(isDesktop
                ? { top: 64, right: 12, bottom: STRIP_H + 12, width: PANEL_W - 24 }
                : { left: 10, right: 10, bottom: STRIP_H + 6, maxHeight: `${SHEET_VH * 100 - 1}vh`, overscrollBehavior: "contain" }),
              overflowY: "auto",
              padding: "22px 20px",
              borderRadius: 18,
              border: `1px solid ${t.rule}`,
              background: t.glass,
              backdropFilter: "blur(24px) saturate(1.5)",
              WebkitBackdropFilter: "blur(24px) saturate(1.5)",
              boxShadow: isDark ? "inset 0 1px 0 rgba(255,255,255,0.06)" : "inset 0 1px 0 rgba(255,255,255,0.8)",
              color: t.ink,
              // Grid rather than flex: flex children would shrink to nothing inside the scrolling mobile sheet
              display: "grid",
              alignContent: "start",
              gap: 20,
            }}
          >
            <div>
              <div style={{ ...mono, fontSize: 8.5, color: t.faint, marginBottom: 8 }}>Capture</div>
              <div style={{ fontFamily: "var(--font-elevated)", fontSize: 19, fontWeight: 400, letterSpacing: "0.01em" }}>
                {cameraName(exif) ?? "Unknown body"}
              </div>
              <div style={{ fontSize: 12, color: t.sub, marginTop: 4, lineHeight: 1.4 }}>{exif.lens ?? "Lens not recorded"}</div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
                background: t.rule,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {stats.map(([label, value]) => (
                <div key={label} style={{ background: isDark ? "rgba(10,9,15,0.82)" : "rgba(252,250,246,0.9)", padding: "12px 14px" }}>
                  <div style={{ ...mono, fontSize: 7.5, color: t.faint }}>{label}</div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={value ?? "none"}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      style={{ fontFamily: "var(--font-elevated)", fontSize: 20, marginTop: 4, fontVariantNumeric: "tabular-nums" }}
                    >
                      {value ?? "-"}
                    </motion.div>
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {photo.palette.length > 0 && (
              <div>
                <div style={{ ...mono, fontSize: 8.5, color: t.faint, marginBottom: 10 }}>Palette</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {photo.palette.map((c, i) => (
                    <motion.button
                      type="button"
                      key={`${photo.src}-${c}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i, duration: 0.4, ease: EASE_OUT }}
                      whileHover={{ y: -3 }}
                      onClick={() => copy(c)}
                      title={`Copy ${c}`}
                      aria-label={`Copy colour ${c}`}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 8,
                        background: c,
                        border: `1px solid ${t.rule}`,
                        cursor: "pointer",
                        position: "relative",
                      }}
                    />
                  ))}
                </div>
                <div style={{ ...mono, fontSize: 8, color: t.sub, marginTop: 8, height: 12 }}>
                  {copied ? `Copied ${copied}` : "Click a swatch to copy"}
                </div>
              </div>
            )}

            <div style={{ ...mono, fontSize: 8, color: t.faint, display: "flex", justifyContent: "space-between", marginTop: "auto" }}>
              <span>{exif.date ?? ""}</span>
              <span>
                {photo.width} × {photo.height}
              </span>
            </div>
            {isDesktop && (
              <div style={{ ...mono, fontSize: 7.5, color: t.faint, lineHeight: 1.9 }}>← → browse · Z loupe · I info · Esc close</div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Filmstrip */}
      <div
        data-own-gestures
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: STRIP_H,
          paddingBottom: "env(safe-area-inset-bottom)",
          display: "flex",
          alignItems: "center",
          maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        }}
      >
        <div
          ref={stripRef}
          style={{ display: "flex", gap: 6, overflowX: "auto", padding: "0 50vw", alignItems: "center", height: "100%", width: "100%" }}
        >
          {items.map((it, i) => {
            const active = i === index;
            const h = active ? 58 : 44;
            return (
              <button
                type="button"
                key={it.photo.src}
                aria-label={`Show photo ${i + 1}`}
                aria-current={active}
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setLoupe(false);
                  onIndex(i);
                }}
                style={{
                  flexShrink: 0,
                  position: "relative",
                  height: h,
                  width: Math.round(h * aspect(it.photo)),
                  padding: 0,
                  border: "none",
                  borderRadius: 3,
                  overflow: "hidden",
                  cursor: "pointer",
                  opacity: active ? 1 : 0.45,
                  outline: active ? `1px solid ${t.ink}` : "none",
                  outlineOffset: 3,
                  transition: "all 0.45s cubic-bezier(0.22,1,0.36,1)",
                  background: it.photo.color,
                }}
              >
                <Image src={it.photo.src} alt="" fill sizes="100px" style={{ objectFit: "cover" }} />
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
