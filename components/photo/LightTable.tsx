"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue } from "framer-motion";
import type { LightboxItem } from "./Lightbox";
import { drop, shutter } from "./feedback";
import { EASE_OUT, aspect, photoTheme } from "./utils";

interface Spot {
  x: number; // 0..1 of table width
  y: number; // 0..1 of table height
  r: number; // degrees
}

// Small deterministic PRNG so the first scatter matches between server and client
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scatter(n: number, seed: number): Spot[] {
  const rand = mulberry(seed);
  return Array.from({ length: n }, () => ({
    x: 0.08 + rand() * 0.84,
    y: 0.12 + rand() * 0.76,
    r: (rand() - 0.5) * 34,
  }));
}

function tidy(n: number, cols: number): Spot[] {
  const rows = Math.ceil(n / cols);
  return Array.from({ length: n }, (_, i) => ({
    x: (0.5 + (i % cols)) / cols,
    y: (0.5 + Math.floor(i / cols)) / rows,
    r: 0,
  }));
}

function Print({
  item,
  spot,
  z,
  width,
  bounds,
  isDark,
  onGrab,
  onOpen,
}: {
  item: LightboxItem;
  spot: Spot;
  z: number;
  width: number;
  bounds: { w: number; h: number };
  isDark: boolean;
  onGrab: () => void;
  onOpen: (rect: DOMRect) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(spot.r);
  const [lifted, setLifted] = useState(false);
  // A drag ends with a pointer-up over the print; this stops it counting as a tap
  const dragged = useRef(false);
  const height = width / aspect(item.photo);

  // Glide to a new spot whenever the table is shuffled or tidied
  useEffect(() => {
    if (!bounds.w) return;
    const tx = spot.x * bounds.w - width / 2;
    const ty = spot.y * bounds.h - height / 2;
    const opts = { type: "spring" as const, stiffness: 90, damping: 16 };
    const a = animate(x, tx, opts);
    const b = animate(y, ty, opts);
    const c = animate(rotate, spot.r, opts);
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [spot, bounds.w, bounds.h, width, height, x, y, rotate]);

  return (
    <motion.div
      ref={ref}
      data-af="Drag · tap to open"
      drag
      dragMomentum
      dragElastic={0.15}
      dragConstraints={{ left: -width * 0.4, top: -height * 0.4, right: bounds.w - width * 0.6, bottom: bounds.h - height * 0.6 }}
      dragTransition={{ power: 0.35, timeConstant: 260, bounceStiffness: 300, bounceDamping: 22 }}
      onPointerDown={() => {
        dragged.current = false;
        onGrab();
        setLifted(true);
      }}
      onDragStart={() => {
        dragged.current = true;
        // Straighten slightly while held, like lifting a print by its corner
        animate(rotate, rotate.get() * 0.4, { duration: 0.3 });
      }}
      onDragEnd={(_, info) => {
        setLifted(false);
        // Throw spin: faster flicks leave the print more askew
        animate(rotate, rotate.get() + info.velocity.x * 0.012, { type: "spring", stiffness: 60, damping: 12 });
        drop();
      }}
      onPointerUp={() => setLifted(false)}
      onTap={() => !dragged.current && ref.current && onOpen(ref.current.getBoundingClientRect())}
      whileTap={{ scale: 1.04 }}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        x,
        y,
        rotate,
        width,
        zIndex: z,
        // Pixel padding: a percentage would resolve against the table, not the print
        padding: `${Math.round(width * 0.05)}px ${Math.round(width * 0.05)}px ${Math.round(width * 0.15)}px`,
        background: isDark ? "#ece7df" : "#fffdf9",
        borderRadius: 2,
        cursor: "grab",
        touchAction: "none",
        boxShadow: lifted
          ? "0 40px 60px -20px rgba(0,0,0,0.55), 0 10px 20px rgba(0,0,0,0.2)"
          : "0 6px 14px -4px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.2)",
        transition: "box-shadow 0.25s ease",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: String(aspect(item.photo)),
          background: item.photo.color,
          overflow: "hidden",
        }}
      >
        <Image
          src={item.photo.src}
          alt={`${item.sectionTitle} photograph`}
          fill
          draggable={false}
          sizes="(min-width: 768px) 220px, 36vw"
          style={{ objectFit: "cover", pointerEvents: "none" }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: "6%",
          right: "6%",
          bottom: "3.5%",
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontSize: Math.max(7, width * 0.04),
          color: "rgba(40,30,50,0.6)",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        <span>{item.sectionTitle}</span>
        <span>{item.photo.exif.date?.slice(0, 4)}</span>
      </div>
    </motion.div>
  );
}

/**
 * A light table of loose prints. Grab one and it lifts toward you; fling it
 * and it slides with momentum and spins with the throw. Tap to open. Shuffle
 * throws them all back down; Tidy squares them into a grid.
 */
export default function LightTable({
  items,
  isDark,
  onOpen,
}: {
  items: LightboxItem[];
  isDark: boolean;
  onOpen: (index: number, rect: DOMRect) => void;
}) {
  const t = photoTheme(isDark);
  const tableRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ w: 0, h: 0 });
  const [seed, setSeed] = useState(7);
  const [tidied, setTidied] = useState(false);
  const [order, setOrder] = useState<number[]>(() => items.map((_, i) => i));
  const narrow = bounds.w > 0 && bounds.w < 640;
  const printW = narrow ? Math.round(bounds.w * 0.36) : Math.round(Math.min(230, Math.max(150, bounds.w * 0.15)));
  const cols = narrow ? 3 : 6;
  const count = narrow ? Math.min(8, items.length) : items.length;

  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBounds({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const spots = useMemo(() => (tidied ? tidy(count, cols) : scatter(count, seed)), [tidied, count, cols, seed]);

  const grab = useCallback((i: number) => setOrder((o) => [...o.filter((k) => k !== i), i]), []);

  const mono: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
  };
  const btn: React.CSSProperties = {
    ...mono,
    fontSize: 9,
    padding: "11px 16px",
    borderRadius: 999,
    border: `1px solid ${t.rule}`,
    background: t.glass,
    color: t.ink,
    cursor: "pointer",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  };

  return (
    <section
      aria-label="Light table"
      style={{ padding: "clamp(60px, 10vh, 120px) clamp(16px, 5vw, 72px) 0", maxWidth: 1400, margin: "0 auto" }}
    >
      <div
        style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 18, marginBottom: 22 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...mono, fontSize: 9.5, color: t.sub }}>The light table</div>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-elevated)",
              fontWeight: 300,
              fontSize: "clamp(1.8rem, 4.4vw, 3.4rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: t.ink,
            }}
          >
            Go on, <span style={{ color: t.faint }}>make a mess.</span>
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            style={btn}
            onClick={() => {
              setTidied(false);
              setSeed((s) => s + 1);
              shutter();
            }}
          >
            Shuffle
          </button>
          <button
            type="button"
            style={btn}
            onClick={() => {
              setTidied(true);
              drop();
            }}
          >
            Tidy up
          </button>
        </div>
      </div>

      <motion.div
        ref={tableRef}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
        style={{
          position: "relative",
          height: "clamp(520px, 78svh, 820px)",
          borderRadius: 18,
          overflow: "hidden",
          // A backlit diffuser: soft falloff, faint grid like a cutting mat
          background: isDark
            ? "radial-gradient(90% 80% at 50% 45%, #2a2733 0%, #16141c 70%, #0f0e14 100%)"
            : "radial-gradient(90% 80% at 50% 45%, #ffffff 0%, #f1ede7 70%, #e7e1d9 100%)",
          boxShadow: isDark
            ? "inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 80px rgba(0,0,0,0.5)"
            : "inset 0 0 0 1px rgba(0,0,0,0.06), inset 0 0 60px rgba(120,100,80,0.12)",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${t.rule} 1px, transparent 1px), linear-gradient(90deg, ${t.rule} 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />
        {bounds.w > 0 &&
          // Fewer prints on phones so there is always bare table to scroll past
          items
            .slice(0, count)
            .map((item, i) => (
              <Print
                key={item.photo.src}
                item={item}
                spot={spots[i]}
                z={order.indexOf(i) + 1}
                width={printW}
                bounds={bounds}
                isDark={isDark}
                onGrab={() => grab(i)}
                onOpen={(rect) => onOpen(i, rect)}
              />
            ))}
        <div
          aria-hidden
          style={{ ...mono, position: "absolute", left: 16, bottom: 14, fontSize: 8.5, color: t.faint, pointerEvents: "none" }}
        >
          Drag, throw, tap to open
        </div>
      </motion.div>
    </section>
  );
}
