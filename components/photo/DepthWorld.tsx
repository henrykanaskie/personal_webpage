"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import type { Section } from "@/app/photography/data";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { LightboxItem } from "./Lightbox";
import FadeImage from "./FadeImage";
import { MONO, aspect, frameClock, photoTheme, rgbTriplet, smoothing } from "./utils";

const FAR = 5600; // anything further than this is lost in the dark
const PASS = 1500; // within this distance prints start swinging aside
const ARRIVE = 760; // how far in front of a station the camera stops when you jump to it
const SCROLL_PER_UNIT = 0.34; // page px of scroll per world unit travelled

// Prototype: this chapter hangs its prints to dry on lines strung across the flight, instead of scattering them
const HANGING = "portraits";
const LINE_HALF = 1.6; // half a line's length, in viewport widths; its ends fade into the dark
const LINE_TOP = -0.5; // the lines' drawing spans this band of the screen height (fractions from the centre)
const LINE_BAND = 0.3;

interface Wire {
  y0: number; // height at the line's middle before it sags, in screen heights from the centre
  tilt: number; // how much higher one end is than the other
  sag: number;
}

/** Height of a line at `x` viewport widths from the centre: a parabola, which is what the SVG's quadratic draws. */
function wireY(w: Wire, x: number) {
  const s = x / LINE_HALF;
  return w.y0 + w.tilt * s + w.sag * (1 - s * s);
}

type Plane =
  | { kind: "intro"; z: number }
  | { kind: "station"; z: number; stop: number; x: number; rz: number }
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
    }
  | { kind: "line"; z: number; wire: Wire }
  | {
      kind: "hang";
      z: number;
      item: LightboxItem;
      archiveIndex: number;
      wire: Wire;
      x: number;
      size: number;
      clip: number; // where the clip holds the print, as an offset from its centre (fraction of its width)
      rz: number;
      phase: number;
    };

interface Stop {
  id: string;
  num: string;
  title: string;
  href: string;
  z: number;
}

// Deterministic pseudo-random numbers so the scatter is identical on server and client
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/**
 * The photography landing page as a place you fly through. Scrolling moves the
 * camera forward past prints tossed into space; each chapter is a station you
 * can enter, and the rail on the side flies you to any of them. The page opens
 * by flying in toward the title and ends at About.
 */
export default function DepthWorld({
  sections,
  perSection,
  isDark,
}: {
  sections: Section[];
  perSection: number;
  isDark: boolean;
}) {
  const t = photoTheme(isDark);
  const router = useRouter();
  const outerRef = useRef<HTMLElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const planeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fillRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(0);
  const [active, setActive] = useState(-1);
  const [hoverStop, setHoverStop] = useState<number | null>(null);
  const [hoverStation, setHoverStation] = useState<number | null>(null);
  const [hoverPrint, setHoverPrint] = useState<number | null>(null);
  // The camera's current depth, for click handlers that need to know how far away something is
  const camRef = useRef(0);
  const enteringRef = useRef(false);
  // Each hanging print's swing: angle (degrees, positive is away from the camera) and angular velocity
  const swingRef = useRef<{ a: number; v: number }[]>([]);
  const shadeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const isMobile = !!useIsMobile();
  const reduceMotion = !!useReducedMotion();

  const { planes, items, stops, depth } = useMemo(() => {
    const rand = rng(20240518);
    const planes: Plane[] = [{ kind: "intro", z: 560 }];
    const items: LightboxItem[] = [];
    const stops: Stop[] = [];
    let z = 2100;
    for (const section of sections) {
      if (section.photos.length === 0) continue;
      stops.push({ id: section.id, num: section.num, title: section.title, href: `/photography/${section.id}`, z });
      planes.push({ kind: "station", z, stop: stops.length - 1, x: (rand() - 0.5) * 0.2, rz: (rand() - 0.5) * 5 });
      // Give each title room before its prints start, so they don't pile up behind the words
      z += 1000;
      const n = Math.min(perSection, section.photos.length);
      if (section.id === HANGING) {
        // Two lines, one behind the other, each with three prints clipped along it
        const perLine = Math.ceil(n / 2);
        for (let first = 0, line = 0; first < n; first += perLine, line++) {
          const wire = { y0: -0.4 + rand() * 0.06, tilt: (rand() - 0.5) * 0.08, sag: 0.05 + rand() * 0.04 };
          planes.push({ kind: "line", z, wire });
          const count = Math.min(perLine, n - first);
          for (let c = 0; c < count; c++) {
            const photo = section.photos[Math.floor(((first + c) * section.photos.length) / n)];
            const item = { photo, sectionId: section.id, sectionTitle: section.title };
            // A print clipped off-centre hangs crooked: the far side drops
            const clip = (rand() - 0.5) * 0.3;
            planes.push({
              kind: "hang",
              z,
              item,
              archiveIndex: items.length,
              wire,
              // The line behind is shifted half a gap so its prints show between the ones in front
              x: ((c + 0.5) / count - 0.5) * 0.9 + (line % 2 ? 0.16 : -0.04) + (rand() - 0.5) * 0.08,
              size: 0.68 + rand() * 0.2,
              clip,
              rz: -clip * 26 + (rand() - 0.5) * 2,
              phase: rand() * Math.PI * 2,
            });
            items.push(item);
          }
          z += 850 + rand() * 200;
        }
        z += 600;
        continue;
      }
      for (let k = 0; k < n; k++) {
        const photo = section.photos[Math.floor((k * section.photos.length) / n)];
        const item = { photo, sectionId: section.id, sectionTitle: section.title };
        // Keep a loose lane down the middle so the stations stay readable
        let x = (rand() - 0.5) * 0.84;
        const y = (rand() - 0.5) * 0.66;
        if (Math.abs(x) < 0.2 && Math.abs(y) < 0.2) x = Math.sign(x || 1) * (0.2 + rand() * 0.12);
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
      z += 600;
    }
    stops.push({ id: "about", num: "", title: "About", href: "/photography/about", z });
    planes.push({ kind: "station", z, stop: stops.length - 1, x: 0, rz: 0 });
    // The flight ends with the last station comfortably in view
    return { planes, items, stops, depth: z - ARRIVE };
  }, [sections, perSection]);

  /** Page scroll position that puts the camera at world depth `z`. */
  const scrollFor = (z: number) => {
    const outer = outerRef.current;
    if (!outer) return 0;
    const range = outer.offsetHeight - window.innerHeight;
    return outer.offsetTop + (Math.max(0, Math.min(depth, z)) / depth) * range;
  };

  const flyTo = (stop: number) => {
    window.scrollTo({ top: scrollFor(stops[stop].z - ARRIVE), behavior: reduceMotion ? "auto" : "smooth" });
  };

  // The camera surges forward through whatever is ahead, then the page changes
  const surgeInto = (href: string) => {
    const fly = flyRef.current;
    if (fly && !reduceMotion) {
      fly.style.transition = "transform 0.75s cubic-bezier(0.55, 0, 0.9, 0.35), opacity 0.75s ease-in";
      fly.style.transform = "translateZ(950px)";
      fly.style.opacity = "0";
    }
    setTimeout(() => router.push(href), reduceMotion ? 0 : 680);
  };

  // Plain clicks only: modifier clicks and middle clicks keep their normal new-tab behaviour
  const plainClick = (e: React.MouseEvent) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0);

  // A chapter title: from far away, fly to it first, then go through it
  const enterStation = (i: number) => (e: React.MouseEvent) => {
    if (!plainClick(e)) return;
    e.preventDefault();
    if (enteringRef.current) return;
    enteringRef.current = true;
    const target = stops[i].z - ARRIVE;
    if (reduceMotion || Math.abs(target - camRef.current) < 1400) {
      surgeInto(stops[i].href);
      return;
    }
    flyTo(i);
    const start = performance.now();
    const waitForArrival = () => {
      // Enter once the camera is nearly there; never wait forever
      if (Math.abs(target - camRef.current) < 140 || performance.now() - start > 1800) surgeInto(stops[i].href);
      else requestAnimationFrame(waitForArrival);
    };
    requestAnimationFrame(waitForArrival);
  };

  // A print: go straight into its chapter
  const enterPrint = (href: string) => (e: React.MouseEvent) => {
    if (!plainClick(e)) return;
    e.preventDefault();
    if (enteringRef.current) return;
    enteringRef.current = true;
    surgeInto(href);
  };

  // Camera loop, running only while the world is on screen
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    let raf = 0;
    const progress = () => {
      const range = outer.offsetHeight - window.innerHeight;
      return range > 0 ? Math.min(1, Math.max(0, (window.scrollY - outer.offsetTop) / range)) : 0;
    };
    // The page opens by flying in from further back
    const introStart = performance.now();
    const INTRO = reduceMotion ? 0 : 2200;
    let camZ = progress() * depth - (reduceMotion ? 0 : 1500);
    let velocity = 0;
    const look = { x: 0, y: 0 };
    const lookTarget = { x: 0, y: 0 };
    let lastNear = -1;
    let lastActive = -2;
    let lastSize = "";
    const clock = frameClock();
    swingRef.current = planes.map(() => ({ a: 0, v: 0 }));

    const onMove = (e: PointerEvent) => {
      lookTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
      lookTarget.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = clock(now);
      const intro = INTRO ? Math.min(1, (now - introStart) / INTRO) : 1;
      const introOffset = -1500 * Math.pow(1 - intro, 3);
      const target = progress() * depth + introOffset;
      const prev = camZ;
      camZ += (target - camZ) * (reduceMotion ? 1 : smoothing(intro < 1 ? 0.2 : 0.075, dt));
      camRef.current = camZ;
      velocity += ((camZ - prev) / Math.max(dt, 1)) * 1000 * 0.1 - velocity * 0.1;
      const kl = reduceMotion ? 0 : smoothing(0.05, dt);
      look.x += (lookTarget.x - look.x) * kl;
      look.y += (lookTarget.y - look.y) * kl;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 768;
      // On a tall phone screen the lines hang lower, or they'd leave the bottom half empty
      const lineVh = mobile ? vh * 0.62 : vh;
      // The lines are drawn in these units, so they match the positions below exactly
      const size = `${vw}x${lineVh}`;
      if (size !== lastSize && stageRef.current) {
        lastSize = size;
        stageRef.current.style.setProperty("--vw", `${vw}px`);
        stageRef.current.style.setProperty("--vh", `${lineVh}px`);
      }
      // The flight's own speed is the wind on the drying lines: fly forward and the prints swing away
      const wind = reduceMotion ? 0 : Math.max(-32, Math.min(32, velocity * 0.012));
      const h = Math.min(dt, 50) / 1000;
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

        // Out of the dark far away; gone only in the last moment before the lens
        let o = rel > FAR * 0.6 ? 1 - (rel - FAR * 0.6) / (FAR * 0.4) : 1;
        if (rel < 160) o *= Math.max(0, (rel + 200) / 360);
        el.style.opacity = o.toFixed(3);

        if (p.kind === "intro" || p.kind === "station") {
          // The opening title sits low and to the left so the world opens up behind it;
          // station titles sit a little below centre, under the vanishing point where prints converge
          const x = p.kind === "station" ? p.x * vw : mobile ? 0 : -0.2 * vw;
          const y = p.kind === "station" ? 0.07 * vh : mobile ? 0.22 * vh : 0.24 * vh;
          const rz = p.kind === "station" ? p.rz : 0;
          el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${(-rel).toFixed(1)}px) rotateZ(${rz}deg)`;
          // Titles stay clickable as long as you can see them, however far away
          el.style.pointerEvents = p.kind === "station" && rel > 120 && rel < FAR * 0.9 ? "auto" : "none";
          continue;
        }

        if (p.kind === "line") {
          el.style.transform = `translateX(-50%) translate3d(0px, ${(LINE_TOP * lineVh).toFixed(1)}px, ${(-rel).toFixed(1)}px)`;
          continue;
        }

        if (p.kind === "hang") {
          // A pendulum on its clip, lightly damped so it sways and settles, pushed by the wind and a slow draught
          const sw = swingRef.current[i];
          const target = wind + Math.sin(time * 0.6 + p.phase) * 3 + Math.sin(time * 1.7 + p.phase * 1.7) * 1.2;
          const w0 = 2 * Math.PI * 0.7;
          sw.v += (-w0 * w0 * (sw.a - target) - 2 * 0.24 * w0 * sw.v) * h;
          sw.a = Math.max(-75, Math.min(75, sw.a + sw.v * h));
          const x = p.x * (mobile ? 1.2 : 1);
          const twist = Math.sin(time * 0.4 + p.phase) * 5 + sw.v * 0.04;
          // The clip sits exactly on the line; the print turns about it
          el.style.transform = `translate(${(-50 - p.clip * 100).toFixed(1)}%, 0) translate3d(${(x * vw).toFixed(1)}px, ${(
            wireY(p.wire, x) * lineVh
          ).toFixed(1)}px, ${(-rel).toFixed(1)}px) rotateY(${twist.toFixed(2)}deg) rotateX(${(-sw.a).toFixed(2)}deg) rotateZ(${p.rz.toFixed(2)}deg)`;
          const shade = shadeRefs.current[i];
          if (shade) shade.style.opacity = Math.min(0.8, Math.abs(sw.a) / 45).toFixed(3);
          el.style.pointerEvents = rel > 60 && rel < FAR * 0.75 ? "auto" : "none";
          if (rel > 0 && rel < best) {
            best = rel;
            bestIdx = p.archiveIndex;
          }
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
        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${(-rel).toFixed(1)}px) rotateX(${(
          p.rx * settle
        ).toFixed(2)}deg) rotateY(${(p.ry * settle).toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
        el.style.pointerEvents = rel > 60 && rel < FAR * 0.75 ? "auto" : "none";
        if (rel > 0 && rel < best) {
          best = rel;
          bestIdx = p.archiveIndex;
        }
      }
      if (bestIdx !== lastNear) {
        lastNear = bestIdx;
        setNear(bestIdx);
      }

      // Rail: which station the camera is at or has passed
      let current = -1;
      for (let s = 0; s < stops.length; s++) if (camZ >= stops[s].z - ARRIVE - 240) current = s;
      if (current !== lastActive) {
        lastActive = current;
        setActive(current);
      }
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${Math.min(1, Math.max(0, camZ / depth)).toFixed(4)})`;
      if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - Math.max(0, camZ) / 400));
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
  }, [planes, stops, depth, reduceMotion]);

  const nearItem = items[near];
  const glow = nearItem ? rgbTriplet(nearItem.photo.palette[1] ?? nearItem.photo.color) : "120,120,160";
  const printBorder = isDark ? "#ebe7e0" : "#fffdf9";
  // A soft glow of the page colour behind titles keeps them readable over prints further back
  const halo = `0 0 28px ${t.bg}, 0 0 10px ${t.bg}`;
  const mono = { ...MONO, letterSpacing: "0.2em" };

  return (
    <section
      ref={outerRef}
      aria-label="Photography"
      style={{
        position: "relative",
        height: `calc(${Math.round(depth * SCROLL_PER_UNIT)}px + 100vh)`,
        // Run the world up under the fixed nav strip
        marginTop: "calc(-1 * (env(safe-area-inset-top) + 72px))",
      }}
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
        ref={stageRef}
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

        {/* These full-screen layers sit at depth 0, in front of every print, so they must let clicks through */}
        <div ref={flyRef} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", pointerEvents: "none" }}>
          <div ref={worldRef} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", pointerEvents: "none" }}>
            {planes.map((p, i) => {
              const ref = (el: HTMLDivElement | null) => {
                planeRefs.current[i] = el;
              };
              const plane: React.CSSProperties = {
                position: "absolute",
                left: "50%",
                top: "50%",
                visibility: "hidden",
                willChange: "transform, opacity",
              };

              if (p.kind === "intro") {
                return (
                  <div
                    key="intro"
                    ref={ref}
                    style={{ ...plane, textAlign: isMobile ? "center" : "left", pointerEvents: "none", textShadow: halo }}
                  >
                    <div style={{ ...mono, fontSize: "clamp(9px, 1vw, 11px)", color: t.sub, marginBottom: 18 }}>Henry Kanaskie</div>
                    <h1
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-elevated)",
                        fontWeight: 300,
                        fontSize: "clamp(3.4rem, 13vw, 12rem)",
                        lineHeight: 0.9,
                        letterSpacing: "-0.04em",
                        color: t.ink,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Photography
                    </h1>
                  </div>
                );
              }

              if (p.kind === "station") {
                const stop = stops[p.stop];
                return (
                  <div key={`s-${stop.id}`} ref={ref} style={{ ...plane, pointerEvents: "none", textShadow: halo }}>
                    <Link
                      href={stop.href}
                      data-af=""
                      onClick={enterStation(p.stop)}
                      onMouseEnter={() => {
                        router.prefetch(stop.href);
                        setHoverStation(p.stop);
                      }}
                      onMouseLeave={() => setHoverStation(null)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 18,
                        textDecoration: "none",
                        color: t.ink,
                      }}
                    >
                      {stop.num && <span style={{ ...mono, fontSize: 11, color: t.faint }}>{stop.num}</span>}
                      <span
                        style={{
                          fontFamily: "var(--font-elevated)",
                          fontWeight: 300,
                          fontSize: "clamp(3rem, 11vw, 10rem)",
                          lineHeight: 0.9,
                          letterSpacing: "-0.04em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {stop.title}
                      </span>
                      <span
                        style={{
                          ...mono,
                          fontSize: 10,
                          padding: "10px 18px",
                          borderRadius: 999,
                          border: `1px solid ${hoverStation === p.stop ? t.ink : t.rule}`,
                          background: hoverStation === p.stop ? t.ink : "transparent",
                          color: hoverStation === p.stop ? t.bg : t.sub,
                          transition: "background 0.25s ease, color 0.25s ease, border-color 0.25s ease",
                        }}
                      >
                        Enter →
                      </span>
                    </Link>
                  </div>
                );
              }

              if (p.kind === "line") {
                const w = LINE_HALF * 200;
                const y = (f: number) => ((f - LINE_TOP) * 100).toFixed(2);
                const gid = `wire-${i}`;
                return (
                  <div
                    key={`l-${i}`}
                    ref={ref}
                    aria-hidden
                    style={{
                      ...plane,
                      top: "50%",
                      width: `calc(var(--vw, 1vw) * ${w / 100})`,
                      height: `calc(var(--vh, 1vh) * ${LINE_BAND})`,
                      pointerEvents: "none",
                    }}
                  >
                    {/* 1 unit is 1% of the screen width across and 1% of its height down */}
                    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${LINE_BAND * 100}`} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
                      <defs>
                        <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0" stopColor={t.ink} stopOpacity="0" />
                          <stop offset="0.36" stopColor={t.ink} stopOpacity="0.5" />
                          <stop offset="0.64" stopColor={t.ink} stopOpacity="0.5" />
                          <stop offset="1" stopColor={t.ink} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M0 ${y(p.wire.y0 - p.wire.tilt)} Q${w / 2} ${y(p.wire.y0 + 2 * p.wire.sag)} ${w} ${y(p.wire.y0 + p.wire.tilt)}`}
                        fill="none"
                        stroke={`url(#${gid})`}
                        // Thicker than a hairline so it doesn't break into dashes far away
                        strokeWidth={1.6}
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>
                );
              }

              const hanging = p.kind === "hang";
              return (
                <div
                  key={`p-${p.item.photo.src}`}
                  ref={ref}
                  style={{
                    ...plane,
                    // Width is fixed in CSS so the per-frame loop never triggers layout
                    width: `calc(var(--print) * ${(p.size * (aspect(p.item.photo) < 1 ? 0.72 : 1)).toFixed(3)})`,
                    ...(hanging ? { transformOrigin: `${50 + p.clip * 100}% 0` } : null),
                  }}
                >
                  <button
                    type="button"
                    data-af=""
                    aria-label={`Go to ${p.item.sectionTitle}`}
                    onClick={enterPrint(`/photography/${p.item.sectionId}`)}
                    onMouseEnter={() => {
                      router.prefetch(`/photography/${p.item.sectionId}`);
                      setHoverPrint(i);
                      // Brushing a hanging print sets it swinging
                      const sw = swingRef.current[i];
                      if (hanging && sw && !reduceMotion) sw.v += 70;
                    }}
                    onMouseLeave={() => setHoverPrint(null)}
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
                        background: p.item.photo.color,
                      }}
                    >
                      <FadeImage src={p.item.photo.src} alt="" fill sizes="(min-width: 768px) 28vw, 56vw" style={{ objectFit: "cover" }} />
                    </span>
                    {hanging && (
                      // Tilting away from you or toward you, the print catches the light differently
                      <span
                        ref={(el) => {
                          shadeRefs.current[i] = el;
                        }}
                        aria-hidden
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 2,
                          background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.24))",
                          opacity: 0,
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </button>
                  {hanging && (
                    // A steel film clip on the line
                    <span
                      aria-hidden
                      style={{
                        position: "absolute",
                        left: `${50 + p.clip * 100}%`,
                        top: 0,
                        width: "6%",
                        minWidth: 5,
                        aspectRatio: "0.5",
                        transform: "translate(-50%, -48%)",
                        borderRadius: 1.5,
                        background: "linear-gradient(90deg, #5d6166, #d9dde2 38%, #9a9fa5 62%, #55595e)",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.45)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  {/* Where a click on this print goes, written under it like a caption */}
                  <span
                    aria-hidden
                    style={{
                      ...mono,
                      position: "absolute",
                      left: 0,
                      top: "100%",
                      marginTop: 10,
                      fontSize: 10,
                      color: t.ink,
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                      textShadow: halo,
                      opacity: hoverPrint === i ? 1 : 0,
                      transition: "opacity 0.25s ease",
                    }}
                  >
                    {p.item.sectionTitle} →
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Station rail: the site's map. Tap a station to fly there. */}
        <nav
          aria-label="Chapters"
          style={{
            position: "absolute",
            left: "clamp(14px, 3vw, 40px)",
            top: "50%",
            transform: "translateY(-50%)",
            height: isMobile ? "44vh" : "52vh",
            width: 1,
            background: t.rule,
          }}
        >
          <div
            ref={fillRef}
            style={{ position: "absolute", inset: 0, background: t.sub, transformOrigin: "top", transform: "scaleY(0)" }}
          />
          {stops.map((s, i) => {
            const f = Math.max(0, Math.min(1, (s.z - ARRIVE) / depth));
            const on = i === active;
            const showLabel = on || hoverStop === i;
            return (
              <button
                key={s.id}
                type="button"
                aria-label={`Fly to ${s.title}`}
                aria-current={on ? "true" : undefined}
                onClick={() => flyTo(i)}
                onMouseEnter={() => setHoverStop(i)}
                onMouseLeave={() => setHoverStop(null)}
                onFocus={() => setHoverStop(i)}
                onBlur={() => setHoverStop(null)}
                style={{
                  position: "absolute",
                  left: 0,
                  top: `${f * 100}%`,
                  // Centre the dot (not the whole button) on the line: 8px padding + half the 9px dot
                  transform: "translate(-12.5px, -50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 8,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: on ? t.ink : t.sub,
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    transform: on ? "scale(1)" : "scale(0.67)",
                    borderRadius: 999,
                    background: on ? t.ink : t.bg,
                    border: `1px solid ${on ? t.ink : t.sub}`,
                    transition: "all 0.3s ease",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    ...mono,
                    fontSize: 9,
                    whiteSpace: "nowrap",
                    opacity: showLabel ? 1 : 0,
                    transform: showLabel ? "translateX(0)" : "translateX(-4px)",
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                    pointerEvents: "none",
                  }}
                >
                  {s.num ? `${s.num} ${s.title}` : s.title}
                </span>
              </button>
            );
          })}
        </nav>

        {/* First-screen cue; disappears as soon as the flight starts */}
        <div
          ref={cueRef}
          aria-hidden
          style={{
            ...mono,
            position: "absolute",
            left: "50%",
            bottom: "calc(clamp(20px, 4vh, 40px) + env(safe-area-inset-bottom))",
            transform: "translateX(-50%)",
            fontSize: 9,
            color: t.sub,
            pointerEvents: "none",
          }}
        >
          Scroll to fly
        </div>
      </div>
    </section>
  );
}
