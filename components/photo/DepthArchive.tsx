"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion, useScroll } from "framer-motion";
import type { Section } from "@/app/photography/data";
import type { LightboxItem } from "./Lightbox";
import { aspect, frameClock, photoTheme, rgbTriplet, smoothing } from "./utils";

const FAR = 5600; // prints further than this are lost in the dark
const PASS = 1500; // within this distance prints start swinging aside
const SCROLL_PER_UNIT = 0.36; // page px of scroll per world unit travelled

type Plane =
  | { kind: "chapter"; z: number; section: Section; x: number; rz: number }
  | {
      kind: "photo";
      z: number;
      item: LightboxItem;
      archiveIndex: number;
      x: number;
      y: number;
      size: number;
      rx: number;
      ry: number;
      rz: number;
      phase: number;
    };

// Deterministic pseudo-random numbers so the scatter is identical on server and client
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/**
 * A scroll-driven drift through prints tossed into space. Scrolling moves the
 * camera forward; prints come out of the dark at odd angles, float a little,
 * then swing aside and turn toward you as you pass. Chapter titles hang in the
 * air ahead of each set. Only transforms and opacity change per frame.
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

  const { planes, items, depth } = useMemo(() => {
    const rand = rng(20240518);
    const planes: Plane[] = [];
    const items: LightboxItem[] = [];
    let z = 900;
    for (const section of sections) {
      if (section.photos.length === 0) continue;
      planes.push({ kind: "chapter", z, section, x: (rand() - 0.5) * 0.24, rz: (rand() - 0.5) * 6 });
      z += 700;
      const n = Math.min(perSection, section.photos.length);
      for (let k = 0; k < n; k++) {
        const photo = section.photos[Math.floor((k * section.photos.length) / n)];
        const item = { photo, sectionId: section.id, sectionTitle: section.title };
        // Keep a loose lane down the middle so the camera always has somewhere to go
        let x = (rand() - 0.5) * 0.84;
        const y = (rand() - 0.5) * 0.66;
        if (Math.abs(x) < 0.12 && Math.abs(y) < 0.14) x = Math.sign(x || 1) * (0.12 + rand() * 0.1);
        planes.push({
          kind: "photo",
          z,
          item,
          archiveIndex: items.length,
          x,
          y,
          size: 0.62 + rand() * 0.55,
          rx: (rand() - 0.5) * 22,
          ry: (rand() - 0.5) * 36,
          rz: (rand() - 0.5) * 26,
          phase: rand() * Math.PI * 2,
        });
        items.push(item);
        // Irregular spacing: now and then two prints land almost on top of each other
        z += rand() < 0.25 ? 110 + rand() * 110 : 260 + rand() * 280;
      }
      z += 500;
    }
    return { planes, items, depth: z + 400 };
  }, [sections, perSection]);

  // Camera loop, running only while the section is on screen
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    let raf = 0;
    let camZ = scrollYProgress.get() * depth;
    let velocity = 0;
    const look = { x: 0, y: 0 };
    const lookTarget = { x: 0, y: 0 };
    let lastNear = -1;
    const clock = frameClock();

    const onMove = (e: PointerEvent) => {
      lookTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
      lookTarget.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = clock(now);
      const target = scrollYProgress.get() * depth;
      const prev = camZ;
      camZ += (target - camZ) * (reduceMotion ? 1 : smoothing(0.075, dt));
      // Smoothed speed in world units per second, for the camera roll
      velocity += ((camZ - prev) / Math.max(dt, 1)) * 1000 * 0.1 - velocity * 0.1;
      const kl = reduceMotion ? 0 : smoothing(0.05, dt);
      look.x += (lookTarget.x - look.x) * kl;
      look.y += (lookTarget.y - look.y) * kl;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 768;
      const time = reduceMotion ? 0 : now / 1000;
      const roll = Math.max(-4, Math.min(4, velocity * 0.0016));

      if (worldRef.current) {
        worldRef.current.style.transform = `rotateZ(${roll.toFixed(2)}deg) rotateY(${(look.x * 3).toFixed(2)}deg) rotateX(${(-look.y * 2).toFixed(2)}deg)`;
      }

      let best = Infinity;
      let bestIdx = 0;
      for (let i = 0; i < planes.length; i++) {
        const p = planes[i];
        const el = planeRefs.current[i];
        if (!el) continue;
        const rel = p.z - camZ;
        if (rel > FAR || rel < -260) {
          if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
          continue;
        }
        if (el.style.visibility !== "visible") el.style.visibility = "visible";

        // Out of the dark, then gone just before touching the lens
        let o = rel > FAR * 0.6 ? 1 - (rel - FAR * 0.6) / (FAR * 0.4) : 1;
        if (rel < 200) o *= Math.max(0, (rel + 260) / 460);

        if (p.kind === "chapter") {
          if (rel < 800) o *= Math.max(0, (rel - 100) / 700);
          el.style.opacity = o.toFixed(3);
          el.style.transform = `translate(-50%, -50%) translate3d(${(p.x * vw).toFixed(1)}px, 0, ${(-rel).toFixed(1)}px) rotateZ(${p.rz}deg)`;
          continue;
        }

        // Approaching prints swing outward and turn to face the camera as they pass
        const pass = rel < PASS ? 1 - Math.max(rel, 0) / PASS : 0;
        const spread = 1 + pass * pass * 1.1;
        const settle = 1 - pass * 0.65;
        const fx = Math.sin(time * 0.35 + p.phase) * 14;
        const fy = Math.cos(time * 0.28 + p.phase * 1.3) * 11;
        const x = p.x * vw * (mobile ? 0.6 : 1) * spread + fx;
        const y = p.y * vh * spread + fy;
        const rz = p.rz * settle + Math.sin(time * 0.22 + p.phase) * 1.6;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${(-rel).toFixed(1)}px) rotateX(${(
          p.rx * settle
        ).toFixed(2)}deg) rotateY(${(p.ry * settle).toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
        el.style.pointerEvents = rel > 60 && rel < 2400 ? "auto" : "none";
        if (rel > 0 && rel < best) {
          best = rel;
          bestIdx = p.archiveIndex;
        }
      }
      if (bestIdx !== lastNear) {
        lastNear = bestIdx;
        setNear(bestIdx);
      }
      if (gaugeRef.current) gaugeRef.current.style.transform = `scaleY(${Math.min(1, camZ / depth).toFixed(4)})`;
    };

    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf);
      if (entry.isIntersecting) raf = requestAnimationFrame(tick);
    });
    io.observe(outer);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [planes, depth, scrollYProgress, reduceMotion]);

  const nearItem = items[near];
  const glow = nearItem ? rgbTriplet(nearItem.photo.palette[1] ?? nearItem.photo.color) : "120,120,160";
  const printBorder = isDark ? "#ebe7e0" : "#fffdf9";

  return (
    <section
      ref={outerRef}
      aria-label="Selected photographs"
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
          ["--print" as string]: isMobile ? "54vw" : "min(460px, 24vw)",
        }}
      >
        {/* Room light takes the colour of the closest print */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(65% 55% at 50% 50%, rgba(${glow},${isDark ? 0.18 : 0.14}), transparent 72%)`,
            transition: "background 1.4s ease",
          }}
        />

        <div ref={worldRef} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
          {planes.map((p, i) =>
            p.kind === "chapter" ? (
              <div
                key={`c-${p.section.id}`}
                ref={(el) => {
                  planeRefs.current[i] = el;
                }}
                aria-hidden
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  visibility: "hidden",
                  willChange: "transform, opacity",
                  fontFamily: "var(--font-elevated)",
                  fontWeight: 300,
                  fontSize: "clamp(3rem, 12vw, 11rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.04em",
                  color: t.ink,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}
              >
                {p.section.title}
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
                  // Width is fixed in CSS so the per-frame loop never triggers layout
                  width: `calc(var(--print) * ${(p.size * (aspect(p.item.photo) < 1 ? 0.72 : 1)).toFixed(3)})`,
                  visibility: "hidden",
                  willChange: "transform, opacity",
                }}
              >
                <button
                  type="button"
                  data-af=""
                  aria-label={`Open ${p.item.sectionTitle} photograph`}
                  onClick={(e) => onOpen(items, p.archiveIndex, e.currentTarget.getBoundingClientRect())}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "3.5%",
                    border: "none",
                    borderRadius: 2,
                    cursor: "pointer",
                    background: printBorder,
                    boxShadow: "0 18px 30px -16px rgba(0,0,0,0.55)",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      position: "relative",
                      width: "100%",
                      aspectRatio: String(aspect(p.item.photo)),
                      background: p.item.photo.blur
                        ? `center / cover no-repeat url(${p.item.photo.blur}), ${p.item.photo.color}`
                        : p.item.photo.color,
                    }}
                  >
                    <Image src={p.item.photo.src} alt="" fill sizes="(min-width: 768px) 28vw, 56vw" style={{ objectFit: "cover" }} />
                  </span>
                </button>
              </div>
            ),
          )}
        </div>

        {/* A quiet progress line; no labels */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: "clamp(14px, 3vw, 36px)",
            top: "50%",
            transform: "translateY(-50%)",
            width: 1,
            height: "24vh",
            background: t.rule,
          }}
        >
          <div
            ref={gaugeRef}
            style={{ position: "absolute", inset: 0, background: t.sub, transformOrigin: "top", transform: "scaleY(0)" }}
          />
        </div>

        <button
          type="button"
          onClick={() => document.getElementById("chapters")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })}
          style={{
            position: "absolute",
            left: "50%",
            bottom: "calc(clamp(18px, 4vh, 36px) + env(safe-area-inset-bottom))",
            transform: "translateX(-50%)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontSize: 9,
            color: t.sub,
            padding: "10px 16px",
            borderRadius: 999,
            border: `1px solid ${t.rule}`,
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Skip ↓
        </button>
      </div>
    </section>
  );
}
