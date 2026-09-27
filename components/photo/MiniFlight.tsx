"use client";

import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import FadeImage from "./FadeImage";
import { frameClock, smoothing } from "./utils";

export interface MiniPrint {
  src: string;
  color: string;
  aspect: number;
}

const SPAN = 3600; // depth of the loop: prints recycle to the back once they pass
const CRUISE = 110; // world units per second at rest
const LEAN_IN = 320; // ... and while the visitor hovers this side

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/**
 * A small, endless version of the photography flight for the split screen:
 * prints drift toward you out of the dark, pass, and recycle to the back.
 * Hovering the panel leans the camera forward. Transform and opacity only.
 */
export default function MiniFlight({
  prints,
  active,
  isDark,
  isMobile,
}: {
  prints: MiniPrint[];
  active: boolean;
  isDark: boolean;
  isMobile: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const planeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeRef = useRef(active);
  activeRef.current = active;
  const reduceMotion = !!useReducedMotion();

  const layout = useMemo(() => {
    const rand = rng(8675309);
    return prints.map((p, i) => {
      // Screen positions (fractions of the panel from its centre). The title and chapter links
      // run across the middle, so prints keep to the band above or below it, or to the far sides.
      const x = (rand() - 0.5) * 0.9;
      let y = (rand() - 0.5) * 0.9;
      if (Math.abs(x) < 0.34 && Math.abs(y) < 0.2) y = Math.sign(y || 1) * (0.2 + rand() * 0.2);
      return {
        x,
        y,
        z0: (i / prints.length) * SPAN + rand() * 180,
        size: (0.7 + rand() * 0.5) * (p.aspect < 1 ? 0.72 : 1),
        rx: (rand() - 0.5) * 20,
        ry: (rand() - 0.5) * 30,
        rz: (rand() - 0.5) * 22,
      };
    });
  }, [prints]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    let travelled = 0;
    let speed = CRUISE;
    const clock = frameClock();

    const persp = isMobile ? 600 : 800;
    const draw = () => {
      const w = root.clientWidth;
      const h = root.clientHeight;
      for (let i = 0; i < layout.length; i++) {
        const el = planeRefs.current[i];
        if (!el) continue;
        const l = layout[i];
        // Distance from the camera, wrapping so the loop never ends
        const rel = SPAN - ((l.z0 + travelled) % SPAN);
        let o = rel > SPAN * 0.65 ? 1 - (rel - SPAN * 0.65) / (SPAN * 0.35) : 1;
        if (rel < 260) o *= Math.max(0, (rel - 40) / 220);
        // Swing outward as they pass, like the full flight. Scaling by the perspective keeps a far
        // print at its screen position instead of sliding into the vanishing point over the title.
        const pass = rel < 1100 ? 1 - rel / 1100 : 0;
        const spread = (1 + pass * pass) * ((persp + rel) / persp);
        const settle = 1 - pass * 0.6;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate(-50%, -50%) translate3d(${(l.x * w * spread).toFixed(1)}px, ${(l.y * h * spread).toFixed(1)}px, ${(-rel).toFixed(
          1,
        )}px) rotateX(${(l.rx * settle).toFixed(1)}deg) rotateY(${(l.ry * settle).toFixed(1)}deg) rotateZ(${(l.rz * settle).toFixed(1)}deg)`;
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = clock(now);
      speed += ((activeRef.current ? LEAN_IN : CRUISE) - speed) * smoothing(0.04, dt);
      travelled += (speed * Math.min(dt, 100)) / 1000;
      draw();
    };

    if (reduceMotion) {
      draw();
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf);
      if (entry.isIntersecting) raf = requestAnimationFrame(tick);
    });
    io.observe(root);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [layout, reduceMotion, isMobile]);

  const border = isDark ? "#ebe7e0" : "#fffdf9";

  return (
    <div
      ref={rootRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        perspective: isMobile ? 600 : 800,
        pointerEvents: "none",
        ["--mini" as string]: isMobile ? "26vw" : "min(210px, 13vw)",
      }}
    >
      {prints.map((p, i) => (
        <div
          key={p.src}
          ref={(el) => {
            planeRefs.current[i] = el;
          }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: `calc(var(--mini) * ${layout[i].size.toFixed(3)})`,
            opacity: 0,
            willChange: "transform, opacity",
            padding: "3.5%",
            background: border,
            borderRadius: 2,
            boxShadow: "0 14px 24px -14px rgba(0,0,0,0.55)",
          }}
        >
          <div style={{ position: "relative", width: "100%", aspectRatio: String(p.aspect), background: p.color }}>
            <FadeImage src={p.src} alt="" fill sizes="(min-width: 768px) 14vw, 28vw" style={{ objectFit: "cover" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
