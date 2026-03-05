"use client";

import { useState, Fragment, useEffect } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIsDark } from "@/components/InfoBubble";

const navLinks = [
  { name: "About", href: "/about" },
  { name: "Experience", href: "/cs/experience" },
  { name: "Projects", href: "/cs/projects" },
  { name: "Education", href: "/cs/education" },
];

const BOKEH = [
  { id: 0, x: "20%", y: "22%", r: 160, blur: 55, v: "a" },
  { id: 1, x: "78%", y: "18%", r: 100, blur: 46, v: "b" },
  { id: 2, x: "74%", y: "74%", r: 180, blur: 60, v: "a" },
  { id: 3, x: "18%", y: "76%", r: 110, blur: 48, v: "b" },
];

// ─── Viewfinder corners ──────────────────────────────────────────────────────

function ViewfinderCorners({ color }: { color: string }) {
  const s = 24,
    o = 24,
    t = `1.5px solid ${color}`;
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: o,
          left: o,
          width: s,
          height: s,
          borderTop: t,
          borderLeft: t,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: o,
          right: o,
          width: s,
          height: s,
          borderTop: t,
          borderRight: t,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: o,
          left: o,
          width: s,
          height: s,
          borderBottom: t,
          borderLeft: t,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: o,
          right: o,
          width: s,
          height: s,
          borderBottom: t,
          borderRight: t,
        }}
      />
    </>
  );
}

// ─── Floating bokeh circle ───────────────────────────────────────────────────

function FloatingBokeh({ c, color }: { c: (typeof BOKEH)[0]; color: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    function drift(
      mv: ReturnType<typeof useMotionValue<number>>,
      range: number,
    ) {
      const target = (Math.random() - 0.5) * range;
      const duration = 1.5 + Math.random() * 2.5;
      animate(mv, target, {
        duration,
        ease: "easeInOut",
        onComplete: () => drift(mv, range),
      });
    }
    drift(x, 200);
    drift(y, 200);
  }, []);

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: c.x, top: c.y, transform: "translate(-50%,-50%)" }}
    >
      <motion.div
        style={{
          x,
          y,
          width: c.r,
          height: c.r,
          borderRadius: "50%",
          background: color,
          filter: `blur(${c.blur}px)`,
          willChange: "transform",
        }}
      />
    </div>
  );
}

// ─── Divider — slow breathing pulse on hover ─────────────────────────────────

function AnimatedDivider({ hovered }: { hovered: "left" | "right" | null }) {
  const active = hovered !== null;
  // warm neutral at rest; shifts slightly warmer on photo hover, cooler on CS hover
  const mid =
    hovered === "left"
      ? "rgba(200,185,155,0.65)"
      : hovered === "right"
        ? "rgba(165,185,220,0.6)"
        : "rgba(180,175,160,0.5)";

  return (
    <div style={{ position: "relative", width: 1, flexShrink: 0, zIndex: 2 }}>
      <motion.div
        animate={{ opacity: active ? [0.4, 1, 0.4] : 0.4 }}
        transition={
          active
            ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.8 }
        }
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, transparent 3%, ${mid} 20%, ${mid} 80%, transparent 97%)`,
        }}
      />
    </div>
  );
}

// ─── Photography panel ───────────────────────────────────────────────────────

function PhotoSide({ active, isDark }: { active: boolean; isDark: boolean }) {
  // Neutral chrome for UI elements
  const g = (a: number) =>
    isDark ? `rgba(245,245,247,${a})` : `rgba(29,29,31,${a})`;

  // Bokeh: soft rose + cool periwinkle
  const bokehA = isDark ? "rgba(255,100,155,0.30)" : "rgba(210,60,110,0.22)";
  const bokehB = isDark ? "rgba(110,140,255,0.24)" : "rgba(80,110,240,0.20)";

  const bg = isDark
    ? "linear-gradient(160deg, #08080e 0%, #0d0810 45%, #08080e 100%)"
    : "linear-gradient(160deg, #f6f4f9 0%, #fefcff 50%, #f3f4f9 100%)";

  const vignette = isDark
    ? "radial-gradient(ellipse at 50% 45%, transparent 28%, rgba(0,0,0,0.68) 100%)"
    : "radial-gradient(ellipse at 50% 45%, transparent 22%, rgba(15,5,30,0.18) 100%)";

  // Pearlescent blue-red gradients for text (subtle)
  const titleGrad = isDark
    ? "linear-gradient(135deg, rgba(228,162,192,0.75) 0%, rgba(192,165,228,0.7) 25%, rgba(158,182,230,0.75) 50%, rgba(188,162,222,0.7) 75%, rgba(224,168,198,0.75) 100%)"
    : "linear-gradient(135deg, rgb(158,68,112) 0%, rgb(132,78,140) 25%, rgb(85,100,162) 50%, rgb(128,75,135) 75%, rgb(152,70,110) 100%)";
  const subGrad = isDark
    ? "linear-gradient(135deg, rgba(222,168,198,0.38) 0%, rgba(182,168,228,0.35) 50%, rgba(162,182,228,0.38) 100%)"
    : "linear-gradient(135deg, rgba(158,68,112,0.42) 0%, rgba(128,80,148,0.4) 50%, rgba(85,100,162,0.42) 100%)";
  const mutedGrad = isDark
    ? "linear-gradient(135deg, rgba(220,168,198,0.2) 0%, rgba(178,165,225,0.18) 50%, rgba(162,180,225,0.2) 100%)"
    : "linear-gradient(135deg, rgba(158,68,112,0.26) 0%, rgba(128,80,148,0.24) 50%, rgba(85,100,162,0.26) 100%)";

  const cornerColor = isDark
    ? "rgba(200,180,228,0.15)"
    : "rgba(120,72,135,0.15)";
  const ruleColor = isDark ? "rgba(195,175,225,0.09)" : "rgba(128,72,138,0.1)";

  return (
    <motion.div
      className="relative w-full h-full"
      animate={{ scale: active ? 1.018 : 1 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      style={{ userSelect: "none" }}
    >
      {/* Background */}
      <div className="absolute inset-0" style={{ background: bg }} />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: vignette }}
      />

      {/* Bokeh — each circle floats freely */}
      {BOKEH.map((c) => (
        <FloatingBokeh key={c.id} c={c} color={c.v === "a" ? bokehA : bokehB} />
      ))}

      {/* Film grain */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: isDark ? 0.09 : 0.07, mixBlendMode: "overlay" }}
      >
        <filter id="photo-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.72"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#photo-grain)" />
      </svg>

      {/* Viewfinder corners */}
      <ViewfinderCorners color={cornerColor} />

      {/* Centered composition */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          whiteSpace: "nowrap",
        }}
      >
        <p
          className="bg-clip-text text-transparent"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: subGrad,
            fontSize: "7.5px",
            letterSpacing: "0.55em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Henry Kanaskie
        </p>
        <div style={{ width: 36, height: "0.5px", background: ruleColor }} />
        <h1
          className="bg-clip-text text-transparent"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: titleGrad,
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            fontWeight: 400,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Photography
        </h1>
        <div style={{ width: 36, height: "0.5px", background: ruleColor }} />
        <p
          className="bg-clip-text text-transparent"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: mutedGrad,
            fontSize: "7px",
            letterSpacing: "0.48em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          35mm · Digital
        </p>
      </div>

      {/* AF focus square — below centered composition */}
      <div
        style={{
          position: "absolute",
          top: "calc(50% + 90px)",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <motion.div
          animate={{ opacity: [0.28, 0.55, 0.28] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "relative", width: 34, height: 34 }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 8,
              height: 8,
              borderTop: `1px solid ${g(1)}`,
              borderLeft: `1px solid ${g(1)}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 8,
              height: 8,
              borderTop: `1px solid ${g(1)}`,
              borderRight: `1px solid ${g(1)}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: 8,
              height: 8,
              borderBottom: `1px solid ${g(1)}`,
              borderLeft: `1px solid ${g(1)}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 8,
              height: 8,
              borderBottom: `1px solid ${g(1)}`,
              borderRight: `1px solid ${g(1)}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: g(0.7),
            }}
          />
        </motion.div>
      </div>

      {/* Camera metadata — bottom center */}
      <div
        style={{
          position: "absolute",
          bottom: 36,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          whiteSpace: "nowrap",
        }}
      >
        {["f / 1.8", "1/1000s", "ISO 400"].map((label, i) => (
          <Fragment key={label}>
            <span
              className="bg-clip-text text-transparent"
              style={{
                WebkitBackgroundClip: "text",
                backgroundImage: mutedGrad,
                fontSize: "7px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
            {i < 2 && (
              <div style={{ width: 1, height: 6, background: g(0.16) }} />
            )}
          </Fragment>
        ))}
      </div>

      {/* Frame counter — bottom-right corner */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          whiteSpace: "nowrap",
        }}
      >
        <span
          className="bg-clip-text text-transparent"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: mutedGrad,
            fontSize: "7px",
            letterSpacing: "0.22em",
            fontVariantNumeric: "tabular-nums",
            fontFamily: "monospace",
          }}
        >
          0024
        </span>
      </div>
    </motion.div>
  );
}

// ─── CS / Tech panel ─────────────────────────────────────────────────────────

function CSSide({ active, isDark }: { active: boolean; isDark: boolean }) {
  const titleGrad = isDark
    ? "linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 40%, rgb(180,210,235) 70%, rgb(210,185,220) 100%)"
    : "linear-gradient(135deg, rgb(75,92,132) 0%, rgb(108,88,118) 40%, rgb(80,112,138) 70%, rgb(112,95,124) 100%)";
  const nameGrad = isDark
    ? "linear-gradient(135deg, rgba(200,215,255,0.55) 0%, rgba(220,205,240,0.5) 100%)"
    : "linear-gradient(135deg, rgba(75,92,132,0.55) 0%, rgba(108,88,118,0.5) 100%)";
  const divColor = isDark ? "rgba(180,200,255,0.15)" : "rgba(80,100,140,0.18)";
  const dotColor = isDark ? "rgba(180,200,255,0.2)" : "rgba(80,100,140,0.22)";

  return (
    <motion.div
      className="relative w-full h-full"
      animate={{ scale: active ? 1.018 : 1 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Name */}
      <div
        style={{
          position: "absolute",
          top: "calc(50% - 54px)",
          left: "50%",
          transform: "translate(-50%,-50%)",
          whiteSpace: "nowrap",
        }}
      >
        <p
          className="bg-clip-text text-transparent"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: nameGrad,
            fontSize: "11px",
            letterSpacing: "0.45em",
            textTransform: "uppercase",
            fontWeight: 500,
            margin: 0,
          }}
        >
          Henry Kanaskie
        </p>
      </div>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        <h1
          className="font-bold bg-clip-text text-transparent"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: titleGrad,
            fontSize: "clamp(2.8rem, 5.5vw, 5rem)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Computer Science
        </h1>
      </div>

      {/* Hairline divider */}
      <div
        style={{
          position: "absolute",
          top: "calc(50% + 48px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: 32,
          height: 1,
          background: divColor,
        }}
      />

      {/* Horizontal nav */}
      <div
        style={{
          position: "absolute",
          top: "calc(50% + 72px)",
          left: "50%",
          transform: "translate(-50%,-50%)",
          display: "flex",
          alignItems: "center",
          gap: 2,
          whiteSpace: "nowrap",
        }}
      >
        {navLinks.map((link, i) => (
          <Fragment key={link.href}>
            <Link
              href={link.href}
              scroll={false}
              className="px-3 py-1.5 rounded-full font-semibold tracking-wide transition-colors duration-200 hover:bg-white/[0.05] dark:hover:bg-white/[0.06]"
              style={{ fontSize: "15px" }}
            >
              <span
                className="bg-clip-text text-transparent"
                style={{
                  WebkitBackgroundClip: "text",
                  backgroundImage: titleGrad,
                  opacity: 0.72,
                }}
              >
                {link.name}
              </span>
            </Link>
            {i < navLinks.length - 1 && (
              <span
                style={{
                  color: dotColor,
                  fontSize: "9px",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                ·
              </span>
            )}
          </Fragment>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [hovered, setHovered] = useState<"left" | "right" | null>(null);
  const isDark = useIsDark();
  const router = useRouter();

  const inactiveDim = "brightness(0.62)";

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 0, display: "flex" }}
      onMouseLeave={() => setHovered(null)}
    >
      {/* Photography */}
      <motion.div
        animate={{
          flex: hovered === "left" ? 1.6 : hovered === "right" ? 0.5 : 1,
          filter: hovered === "right" ? inactiveDim : "brightness(1)",
        }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        style={{ minWidth: 0, overflow: "hidden", cursor: "pointer" }}
        onMouseEnter={() => setHovered("left")}
        onClick={() => router.push("/photography")}
      >
        <PhotoSide active={hovered === "left"} isDark={isDark} />
      </motion.div>

      <AnimatedDivider hovered={hovered} />

      {/* CS */}
      <motion.div
        animate={{
          flex: hovered === "right" ? 1.6 : hovered === "left" ? 0.5 : 1,
          filter: hovered === "left" ? inactiveDim : "brightness(1)",
        }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        style={{ minWidth: 0, overflow: "hidden", cursor: "pointer" }}
        onMouseEnter={() => setHovered("right")}
        onClick={() => router.push("/about")}
      >
        <CSSide active={hovered === "right"} isDark={isDark} />
      </motion.div>
    </div>
  );
}
