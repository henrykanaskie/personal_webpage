"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import type { PhotoEntry } from "@/app/photography/data";
import { EASE_OUT, aspect, photoTheme } from "./utils";

// The slot-machine reels: real camera values, cycled fast
const REELS = [
  ["ƒ/1.4", "ƒ/2", "ƒ/2.8", "ƒ/4", "ƒ/5.6", "ƒ/8", "ƒ/11", "ƒ/16"],
  ["1/8000", "1/2000", "1/500", "1/125", "1/30", "1/4", "2″", "20″"],
  ["ISO 100", "ISO 200", "ISO 400", "ISO 800", "ISO 1600", "ISO 3200", "ISO 6400"],
];

/** Invitation to the exposure game: a frame whose settings won't sit still. */
export default function PlayTeaser({ photo, isDark }: { photo: PhotoEntry; isDark: boolean }) {
  const t = photoTheme(isDark);
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!inView || reduce) return;
    // Spin faster while hovered, like pulling the lever
    const id = setInterval(() => setTick((n) => n + 1), hover ? 70 : 220);
    return () => clearInterval(id);
  }, [inView, reduce, hover]);

  const mono: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
  };

  return (
    <section style={{ padding: "clamp(80px, 14vh, 150px) clamp(16px, 5vw, 72px) 0", maxWidth: 1400, margin: "0 auto" }}>
      <Link
        ref={ref}
        href="/photography/play"
        data-af="Play"
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: "clamp(24px, 4vw, 56px)",
          alignItems: "center",
          padding: "clamp(20px, 3vw, 36px)",
          borderRadius: 22,
          border: `1px solid ${t.rule}`,
          background: isDark
            ? "linear-gradient(135deg, rgba(150,165,255,0.08), rgba(255,100,155,0.05))"
            : "linear-gradient(135deg, rgba(210,60,110,0.06), rgba(85,100,162,0.06))",
          textDecoration: "none",
          color: t.ink,
        }}
      >
        <div
          style={{
            position: "relative",
            aspectRatio: String(Math.max(1.2, aspect(photo))),
            borderRadius: 12,
            overflow: "hidden",
            background: photo.color,
          }}
        >
          <motion.div
            animate={{ scale: hover ? 1.06 : 1 }}
            transition={{ duration: 1.2, ease: EASE_OUT }}
            style={{ position: "absolute", inset: 0 }}
          >
            <Image src={photo.src} alt="" fill sizes="(min-width: 768px) 45vw, 90vw" style={{ objectFit: "cover" }} />
          </motion.div>
          <div
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 12,
              display: "flex",
              justifyContent: "space-between",
              gap: 6,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(8,8,12,0.62)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: "#fff",
              ...mono,
              letterSpacing: "0.08em",
              fontSize: "clamp(10px, 1.4vw, 13px)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {REELS.map((reel, i) => (
              <span key={i} style={{ minWidth: 0, textAlign: i === 0 ? "left" : i === 2 ? "right" : "center", flex: 1 }}>
                {reel[(tick * (i + 2) + i * 3) % reel.length]}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ ...mono, fontSize: 9.5, color: t.sub }}>Take a break · a game</div>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-elevated)",
              fontWeight: 300,
              fontSize: "clamp(2rem, 5vw, 4rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
            }}
          >
            Can you read light?
          </h2>
          <p style={{ margin: 0, color: t.sub, fontSize: "clamp(0.98rem, 1.25vw, 1.08rem)", lineHeight: 1.7, maxWidth: "44ch" }}>
            Ten of these photos, one question each: what was the shutter speed, aperture, ISO or focal length? The camera kept the answers.
          </p>
          <span
            style={{
              ...mono,
              alignSelf: "flex-start",
              fontSize: 10,
              padding: "15px 24px",
              borderRadius: 999,
              background: t.ink,
              color: t.bg,
            }}
          >
            Guess the exposure →
          </span>
        </div>
      </Link>
    </section>
  );
}
