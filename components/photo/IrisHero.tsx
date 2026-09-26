"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion, useScroll } from "framer-motion";
import type { PhotoEntry } from "@/app/photography/data";
import { EASE_OUT, exposureLine, frameClock, pad2, smoothing } from "./utils";
import { shutter } from "./feedback";

const BLADES = 9;
const IRIS_OPEN = 160;
const ROTATE_MS = 7000;

export interface HeroItem {
  photo: PhotoEntry;
  sectionTitle: string;
}

/**
 * One blade of the aperture iris. Each blade is a large sheet whose inner edge
 * sits `r` units from the centre; nine of them overlap into a polygonal opening.
 * The whole set twists as it closes, which gives the pinwheel look of a real lens.
 */
function bladeTransform(i: number, r: number): string {
  const twist = (1 - r / IRIS_OPEN) * 38;
  return `rotate(${(i * 360) / BLADES + twist}) translate(${r} 0)`;
}

/**
 * Landing hero. The frame sits out of focus; the pointer is a lens that
 * renders it sharp inside a focus ring, and scrolling pulls focus until the
 * whole frame is crisp. Between frames an aperture iris closes and reopens.
 */
export default function IrisHero({
  items,
  totalFrames,
  chapters,
  isDark,
}: {
  items: HeroItem[];
  totalFrames: number;
  chapters: number;
  isDark: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sharpRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGGElement>(null);
  const ticksRef = useRef<SVGGElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const bladeRefs = useRef<(SVGPathElement | null)[]>([]);

  const [active, setActive] = useState(0);
  const [irisClosed, setIrisClosed] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);
  const iris = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const reduceMotion = !!useReducedMotion();

  const current = items[active];

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Drive blade geometry straight from the motion value (no React re-renders)
  useEffect(() => {
    const apply = (r: number) => {
      bladeRefs.current.forEach((el, i) => el?.setAttribute("transform", bladeTransform(i, r)));
      setIrisClosed(r < IRIS_OPEN - 1);
    };
    apply(iris.get());
    return iris.on("change", apply);
  }, [iris]);

  // One routine takes every shot, whether the timer fires or the visitor taps
  const shootRef = useRef<(manual: boolean) => void>(() => {});
  const [flash, setFlash] = useState(0);

  // Opening shutter on load, then cycle frames through the iris
  useEffect(() => {
    let cancelled = false;
    let busy = false;
    let timer: ReturnType<typeof setTimeout>;
    const open = () => animate(iris, IRIS_OPEN, { duration: reduceMotion ? 0 : 1.3, ease: [0.16, 1, 0.3, 1] });
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // Don't cycle while the hero is scrolled away
        if (scrollYProgress.get() > 0.5) return schedule();
        void shoot(false);
      }, ROTATE_MS);
    };
    const shoot = async (manual: boolean) => {
      if (busy) return;
      busy = true;
      clearTimeout(timer);
      if (manual) {
        shutter();
        setFlash((f) => f + 1);
      }
      // A tap fires a snappier shutter than the ambient cycle
      await animate(iris, 0, { duration: reduceMotion ? 0 : manual ? 0.22 : 0.55, ease: [0.7, 0, 0.84, 0] });
      if (cancelled) return;
      setActive((a) => (a + 1) % items.length);
      await new Promise((r) => setTimeout(r, manual ? 60 : 140));
      if (cancelled) return;
      await open();
      busy = false;
      if (!cancelled) schedule();
    };
    shootRef.current = (manual) => void shoot(manual);
    const intro = setTimeout(async () => {
      busy = true;
      await open();
      busy = false;
      if (!cancelled) schedule();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(intro);
      clearTimeout(timer);
    };
  }, [iris, items.length, scrollYProgress, reduceMotion]);

  // Lens: follows the pointer, drifts on its own when idle or on touch
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const target = { x: 0.62, y: 0.45 };
    const pos = { x: 0.62, y: 0.45 };
    let lastMove = -Infinity;
    let raf = 0;
    let ringAngle = 0;
    let prevR = 0;

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      target.x = (e.clientX - r.left) / r.width;
      target.y = (e.clientY - r.top) / r.height;
      lastMove = performance.now();
    };

    const clock = frameClock();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const k = smoothing(0.085, clock(now));
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (now - lastMove > 2600 && !reduceMotion) {
        // Lissajous drift so the lens keeps hunting across the frame
        const s = now / 1000;
        target.x = 0.5 + Math.sin(s * 0.37) * 0.28;
        target.y = 0.48 + Math.sin(s * 0.53 + 1.2) * 0.2;
      }
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;

      const p = Math.min(1, scrollYProgress.get() * 1.6);
      const base = Math.min(w, h) * (w < 640 ? 0.26 : 0.19);
      const breathe = Math.sin(now / 900) * 3;
      const diag = Math.hypot(w, h);
      const r = base + breathe + (diag - base) * p * p;
      const x = pos.x * w;
      const y = pos.y * h;

      const mask = `radial-gradient(circle at ${x}px ${y}px, #000 ${r - 1}px, rgba(0,0,0,0.6) ${r + 10}px, transparent ${r + 42}px)`;
      if (sharpRef.current) {
        sharpRef.current.style.maskImage = mask;
        sharpRef.current.style.webkitMaskImage = mask;
      }
      // The focus ring turns as the radius changes, like a lens barrel
      ringAngle += (r - prevR) * 0.6 + (target.x - pos.x) * 40;
      prevR = r;
      if (ringRef.current) {
        ringRef.current.setAttribute("transform", `translate(${x} ${y}) scale(${r / 100})`);
        ringRef.current.style.opacity = String(Math.max(0, 1 - p * 2.2));
      }
      if (ticksRef.current) ticksRef.current.setAttribute("transform", `rotate(${ringAngle})`);
      if (readoutRef.current) {
        if (w < 640) {
          // Narrow screens: centre the readout under the lens, clamped inside the frame
          const cx = Math.min(w - 110, Math.max(110, x));
          readoutRef.current.style.transform = `translate3d(${cx}px, ${y + r + 18}px, 0) translateX(-50%)`;
          readoutRef.current.style.textAlign = "center";
        } else {
          const flip = x + r + 300 > w;
          readoutRef.current.style.transform = `translate3d(${flip ? x - r - 16 : x + r + 16}px, ${y - 8}px, 0) translateX(${flip ? "-100%" : "0"})`;
          readoutRef.current.style.textAlign = flip ? "right" : "left";
        }
        readoutRef.current.style.opacity = String(Math.max(0, 1 - p * 2.2));
      }
      if (titleRef.current) {
        titleRef.current.style.transform = `translate3d(0, ${p * -60}px, 0) scale(${1 + p * 0.08})`;
        titleRef.current.style.letterSpacing = `${-0.04 + p * 0.12}em`;
        titleRef.current.style.opacity = String(1 - p * 0.9);
      }
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [scrollYProgress, reduceMotion]);

  const mono: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
  };
  const bladeFill = isDark ? "#0b0a10" : "#1a1720";

  return (
    <section
      ref={sectionRef}
      aria-label="Featured photographs"
      style={{
        position: "relative",
        height: "185vh",
        // Run the hero up under the fixed nav strip
        marginTop: "calc(-1 * (env(safe-area-inset-top) + 72px))",
      }}
    >
      <div
        ref={stageRef}
        data-af="Tap to shoot"
        onClick={() => shootRef.current(true)}
        style={{ position: "sticky", top: 0, height: "100svh", overflow: "hidden", background: "#060508", cursor: "pointer" }}
      >
        {/* Camera flash when the visitor takes the shot */}
        {flash > 0 && (
          <motion.div
            key={flash}
            aria-hidden
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 5, pointerEvents: "none" }}
          />
        )}
        {/* Out-of-focus plate */}
        <div style={{ position: "absolute", inset: 0, filter: "blur(22px) saturate(0.55) brightness(0.55)", transform: "scale(1.1)" }}>
          <Image
            key={`soft-${current.photo.src}`}
            src={current.photo.src}
            alt=""
            fill
            sizes="60vw"
            placeholder={current.photo.blur ? "blur" : "empty"}
            blurDataURL={current.photo.blur || undefined}
            style={{ objectFit: "cover" }}
            priority
          />
        </div>

        {/* In-focus plate, revealed through the lens */}
        <div ref={sharpRef} style={{ position: "absolute", inset: 0 }}>
          <Image
            key={`sharp-${current.photo.src}`}
            src={current.photo.src}
            alt={`${current.sectionTitle} photograph`}
            fill
            sizes="100vw"
            quality={88}
            style={{ objectFit: "cover" }}
            priority
          />
        </div>

        {/* Preload the next frame so the iris never opens on an empty plate */}
        <div aria-hidden style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }}>
          <Image src={items[(active + 1) % items.length].photo.src} alt="" width={16} height={16} sizes="100vw" />
        </div>

        {/* Vignette + grade */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(120% 90% at 50% 45%, transparent 45%, rgba(0,0,0,0.6) 100%), linear-gradient(to bottom, rgba(0,0,0,0.35), transparent 25%, transparent 70%, rgba(0,0,0,0.55))",
            pointerEvents: "none",
          }}
        />

        {/* Focus ring HUD */}
        <svg
          aria-hidden
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
        >
          <g ref={ringRef}>
            <circle r="100" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
            <circle r="106" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
            <g ref={ticksRef}>
              {Array.from({ length: 72 }, (_, i) => {
                const a = (i / 72) * Math.PI * 2;
                const long = i % 6 === 0;
                const r1 = 106;
                const r2 = long ? 114 : 110;
                return (
                  <line
                    key={i}
                    x1={Math.cos(a) * r1}
                    y1={Math.sin(a) * r1}
                    x2={Math.cos(a) * r2}
                    y2={Math.sin(a) * r2}
                    stroke={long ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)"}
                    strokeWidth="0.8"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>
            <path d="M-6 0h12M0 -6v12" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>

        <div
          ref={readoutRef}
          aria-hidden
          style={{
            ...mono,
            position: "absolute",
            left: 0,
            top: 0,
            fontSize: 9,
            lineHeight: 1.9,
            color: "rgba(255,255,255,0.85)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            textShadow: "0 1px 8px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ color: "rgb(140,255,180)" }}>● AF-C Lock</div>
          <div>{exposureLine(current.photo.exif)}</div>
          <div style={{ opacity: 0.6 }}>{current.sectionTitle}</div>
        </div>

        {/* Title */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "0 clamp(18px, 5vw, 72px) clamp(90px, 14vh, 150px)",
            pointerEvents: "none",
          }}
        >
          <div ref={titleRef} style={{ transformOrigin: "left bottom" }}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.1, ease: EASE_OUT }}
              style={{
                ...mono,
                fontSize: 10,
                color: "rgba(255,255,255,0.75)",
                marginBottom: 18,
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 14px",
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
            >
              <span>Henry Kanaskie</span>
              <span style={{ width: 28, height: 1, background: "rgba(255,255,255,0.4)" }} />
              <span>
                {totalFrames} frames · {chapters} chapters
              </span>
            </motion.div>
            <div style={{ mixBlendMode: "difference", color: "#fff" }}>
              <h1
                aria-label="Photography"
                style={{
                  margin: 0,
                  fontFamily: "var(--font-elevated)",
                  fontWeight: 300,
                  fontSize: "clamp(3.2rem, 13.5vw, 13rem)",
                  lineHeight: 1,
                  letterSpacing: "inherit",
                  display: "flex",
                  overflow: "hidden",
                  paddingBottom: "0.22em",
                  marginBottom: "-0.22em",
                }}
              >
                {"Photography".split("").map((ch, i) => (
                  <motion.span
                    key={i}
                    aria-hidden
                    initial={{ y: "105%", filter: "blur(10px)" }}
                    animate={{ y: "0%", filter: "blur(0px)" }}
                    transition={{ duration: 1.1, delay: 0.55 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: "inline-block" }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </h1>
            </div>
          </div>
        </div>

        {/* Frame index + scroll cue */}
        <div
          style={{
            ...mono,
            position: "absolute",
            left: "clamp(18px, 5vw, 72px)",
            right: "clamp(18px, 5vw, 72px)",
            bottom: "clamp(28px, 5vh, 48px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 9,
            color: "rgba(255,255,255,0.65)",
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ marginRight: 8, whiteSpace: "nowrap" }}>
              {pad2(active + 1)} / {pad2(items.length)}
            </span>
            {items.map((_, i) => (
              <span
                key={i}
                style={{
                  position: "relative",
                  width: "clamp(12px, 2vw, 26px)",
                  height: 1,
                  background: "rgba(255,255,255,0.22)",
                  overflow: "hidden",
                }}
              >
                {i === active && (
                  <motion.span
                    key={`bar-${active}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: (ROTATE_MS + 1300) / 1000, ease: "linear" }}
                    style={{ position: "absolute", inset: 0, background: "#fff", transformOrigin: "left" }}
                  />
                )}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ whiteSpace: "nowrap" }}>{isNarrow ? "Tap to shoot · scroll" : "Click to shoot · scroll to pull focus"}</span>
            <motion.span
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{ display: "inline-block" }}
            >
              ↓
            </motion.span>
          </div>
        </div>

        {/* Aperture iris */}
        <svg
          aria-hidden
          viewBox="-100 -100 200 200"
          preserveAspectRatio="xMidYMid slice"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            visibility: irisClosed ? "visible" : "hidden",
          }}
        >
          <defs>
            <linearGradient id="iris-blade" x1="0" y1="-1" x2="0" y2="1" gradientUnits="objectBoundingBox">
              <stop offset="0" stopColor={isDark ? "#1d1b26" : "#2a2633"} />
              <stop offset="0.5" stopColor={bladeFill} />
              <stop offset="1" stopColor={isDark ? "#131219" : "#1f1c26"} />
            </linearGradient>
          </defs>
          {Array.from({ length: BLADES }, (_, i) => (
            <path
              key={i}
              ref={(el) => {
                bladeRefs.current[i] = el;
              }}
              d="M0 -260 L420 -260 L420 260 L0 260 Z"
              fill="url(#iris-blade)"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="0.35"
              transform={bladeTransform(i, 0)}
            />
          ))}
        </svg>
      </div>
    </section>
  );
}
