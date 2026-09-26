"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EASE_OUT, photoTheme } from "./utils";

const NOTES: { title: string; body: string }[] = [
  {
    title: "A hand-written EXIF reader",
    body: "At build time a small TIFF parser walks each JPEG's metadata for camera, lens, focal length, aperture, shutter and ISO. No metadata library.",
  },
  {
    title: "Every photo analysed",
    body: "Sharp computes a 48-bin RGB histogram, a five-colour palette, a dominant colour and a blur-up placeholder for each frame, so the page knows what each picture looks like before it loads.",
  },
  {
    title: "A raw-style editor on your GPU",
    body: "Develop mode is one WebGL2 shader. Exposure and white balance run in linear light like a raw converter, then tone, colour, vignette and grain. The edit is read back to redraw the histogram live.",
  },
  {
    title: "Scroll-driven 3D without a 3D library",
    body: "The archive is CSS 3D moved by a single animation loop. Easing is frame-rate independent, so it glides the same on 60Hz and 120Hz screens.",
  },
  {
    title: "Charts on photographic scales",
    body: "Exposure space plots shutter, aperture, ISO and focal length on log axes, so one stop of light is one step on the chart.",
  },
  {
    title: "Optics as interface",
    body: "The hero is a focus pull: a masked in-focus plate follows the pointer inside a focus ring, and a nine-blade iris drawn in SVG shutters between frames.",
  },
];

const STACK = ["Next.js 16", "React 19", "TypeScript", "WebGL2", "Framer Motion", "Sharp"];

/** How the photography side is built, for visitors who care about the engineering. */
export default function Colophon({ isDark }: { isDark: boolean }) {
  const t = photoTheme(isDark);
  const mono: React.CSSProperties = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
  };

  return (
    <section
      aria-label="How this was built"
      style={{ padding: "clamp(60px, 10vh, 120px) clamp(16px, 5vw, 72px) clamp(90px, 14vh, 160px)", maxWidth: 1400, margin: "0 auto" }}
    >
      <div
        style={{ borderTop: `1px solid ${t.rule}`, paddingTop: "clamp(36px, 6vw, 64px)", display: "grid", gap: "clamp(32px, 5vw, 56px)" }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: "36em" }}>
            <div style={{ ...mono, fontSize: 9.5, color: t.sub }}>Colophon</div>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-elevated)",
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 4.4vw, 3.4rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                color: t.ink,
              }}
            >
              Shot by me. <span style={{ color: t.faint }}>Built by me too.</span>
            </h2>
            <p style={{ margin: 0, color: t.sub, fontSize: "clamp(0.98rem, 1.25vw, 1.08rem)", lineHeight: 1.7 }}>
              Open any photo and press <strong style={{ color: t.ink, fontWeight: 500 }}>Develop</strong> to edit it live, the way I would.
            </p>
          </div>
          <Link
            href="/cs"
            style={{
              ...mono,
              fontSize: 10,
              padding: "15px 22px",
              borderRadius: 999,
              background: t.ink,
              color: t.bg,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            See the engineering side →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            gap: "clamp(24px, 3vw, 40px) clamp(24px, 4vw, 56px)",
          }}
        >
          {NOTES.map((n, i) => (
            <motion.div
              key={n.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-5% 0px" }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease: EASE_OUT }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <h3 style={{ margin: 0, fontFamily: "var(--font-elevated)", fontWeight: 400, fontSize: "1.15rem", color: t.ink }}>
                {n.title}
              </h3>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: t.sub }}>{n.body}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {STACK.map((s) => (
            <span
              key={s}
              style={{ ...mono, fontSize: 8.5, color: t.sub, padding: "8px 12px", borderRadius: 999, border: `1px solid ${t.rule}` }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
