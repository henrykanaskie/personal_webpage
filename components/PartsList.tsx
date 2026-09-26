"use client";

import { motion } from "framer-motion";
import { GlassLayers } from "@/lib/glass";
import { glassBoxClassNames } from "@/lib/tokens";
import { parts, STATUS, type Part, type PartStatus } from "@/lib/parts";

// ─── DotMeter ───────────────────────────────────────────────────────────────
// Completion as ten dots on the same grid language as the page: filled dots are
// ink, the rest are empty rings. They fill left to right when the row arrives.

export function DotMeter({ value, delay = 0 }: { value: number; delay?: number }) {
  const filled = Math.round(value * 10);
  return (
    <span className="inline-flex items-center gap-[5px]" aria-label={`${Math.round(value * 100)}% complete`}>
      {Array.from({ length: 10 }, (_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0.2, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ type: "spring", stiffness: 520, damping: 30, delay: delay + i * 0.035 }}
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            display: "block",
            background: i < filled ? "var(--ink)" : "transparent",
            boxShadow: i < filled ? "none" : "inset 0 0 0 1px var(--ink-3)",
            opacity: i < filled ? 0.85 : 1,
          }}
        />
      ))}
    </span>
  );
}

function StatusTag({ status }: { status: PartStatus }) {
  return (
    <span className="mono inline-flex items-center gap-1.5" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--ink-2)" }}>
      <span aria-hidden style={{ color: "var(--ink)", fontSize: 12 }}>
        {STATUS[status].mark}
      </span>
      {status}
    </span>
  );
}

function PartName({ part }: { part: Part }) {
  const inner = (
    <span className="font-[family-name:var(--font-elevated)]" style={{ fontWeight: 600, fontSize: 16, color: "var(--ink)", letterSpacing: "-0.01em" }}>
      {/* break only after underscores, never mid-word */}
      {part.name.split("_").map((seg, i, all) => (
        <span key={i}>
          {seg}
          {i < all.length - 1 && (
            <>
              _<wbr />
            </>
          )}
        </span>
      ))}
    </span>
  );
  if (!part.repo) return inner;
  return (
    <a
      href={part.repo}
      target="_blank"
      rel="noopener noreferrer"
      className="group/link inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
      style={{ textDecorationColor: "var(--ink-3)" }}
    >
      {inner}
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden className="opacity-40 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">
        <path d="M3.5 8.5l5-5M4.5 3.5h4v4" stroke="var(--ink)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

const COLS = "md:grid-cols-[76px_minmax(150px,190px)_1fr_minmax(150px,210px)_118px_128px]";

export default function PartsList() {
  const qualified = parts.filter((p) => p.status === "QUALIFIED").length;
  const privateCount = parts.filter((p) => !p.repo).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[1280px] mx-auto px-3 md:px-0"
    >
      <div data-liquid className={`${glassBoxClassNames} relative rounded-[24px] overflow-hidden`}>
        <GlassLayers />

        {/* Title */}
        <div className="relative z-[1] flex flex-wrap items-end justify-between gap-3 px-5 md:px-8 pt-6 md:pt-7 pb-5" style={{ borderBottom: "1px solid var(--hair)" }}>
          <div>
            <div className="font-[family-name:var(--font-elevated)] metal-text" style={{ fontSize: "clamp(1.5rem, 2.4vw, 2rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Everything I&apos;ve built
            </div>
          </div>
          <div className="mono flex gap-5" style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--ink-2)" }}>
            <span>{parts.length} PARTS</span>
            <span>{qualified} QUALIFIED</span>
            <span>{privateCount} PRIVATE</span>
          </div>
        </div>

        {/* Column heads */}
        <div className={`relative z-[1] hidden md:grid ${COLS} gap-4 px-8 py-3 mono`} style={{ fontSize: 10.5, letterSpacing: "0.14em", color: "var(--ink-3)", borderBottom: "1px solid var(--hair)" }}>
          <span>REF</span>
          <span>PART</span>
          <span>WHAT IT DOES</span>
          <span>BUILT ON</span>
          <span>STATUS</span>
          <span>COMPLETE</span>
        </div>

        <ul className="relative z-[1]">
          {parts.map((part, i) => (
            <motion.li
              key={part.pn}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: (i % 4) * 0.04 }}
              className={`grid grid-cols-[62px_minmax(0,1fr)] ${COLS} gap-x-4 gap-y-1.5 px-5 md:px-8 py-4 items-center transition-colors hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]`}
              style={{ borderBottom: i < parts.length - 1 ? "1px solid var(--hair)" : "none" }}
            >
              <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)", letterSpacing: "0.04em" }}>
                {part.pn}
              </span>
              <span className="min-w-0">
                <PartName part={part} />
                {part.note && (
                  <span className="mono ml-2" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.1em" }}>
                    {part.note.toUpperCase()}
                  </span>
                )}
              </span>
              <span className="col-span-2 md:col-span-1 text-[14px] md:text-[14.5px]" style={{ color: "var(--ink-2)", lineHeight: 1.5 }}>
                {part.does}
              </span>
              <span className="col-span-2 md:col-span-1 mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                {part.stack}
              </span>
              <span className="col-span-2 md:col-span-1 flex items-center justify-between md:contents">
                <StatusTag status={part.status} />
                <span className="flex items-center gap-2.5">
                  <DotMeter value={part.completion} delay={0.15} />
                  <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", minWidth: 30, textAlign: "right" }}>
                    {Math.round(part.completion * 100)}%
                  </span>
                </span>
              </span>
            </motion.li>
          ))}
        </ul>

        {/* Legend: the status vocabulary */}
        <div className="relative z-[1] flex flex-wrap gap-x-6 gap-y-2 px-5 md:px-8 py-4 mono" style={{ fontSize: 10.5, letterSpacing: "0.06em", color: "var(--ink-3)", borderTop: "1px solid var(--hair)" }}>
          {(Object.keys(STATUS) as PartStatus[]).map((k) => (
            <span key={k}>
              <span style={{ color: "var(--ink-2)" }}>{STATUS[k].mark}</span> {k}: {STATUS[k].blurb}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
