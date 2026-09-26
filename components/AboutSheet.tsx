"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import GlassTitle from "@/components/GlassTitle";
import { GlassLayers } from "@/lib/glass";
import { glassBoxClassNames, metalClassNames } from "@/lib/tokens";

// ─── AboutSheet ─────────────────────────────────────────────────────────────
// The About section as the first sheet of the drawing set: the name as a title
// on the paper (like every other section), then one glass sheet holding the
// portrait, a spec table, the prose and the contact controls. Every spec row is
// something a stranger could check.

const SPEC: [string, string][] = [
  ["Now", "Intern, Daimler Truck North America"],
  ["Study", "M.S. Computer Science, Oregon State"],
  ["Before", "Honors B.S. Computer Science, 3.95 GPA"],
  ["Focus", "Machine learning · signal processing · embedded C · optimization"],
];

const rise = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 170, damping: 26, delay: 0.12 + i * 0.06 },
});

export default function AboutSheet({
  about,
  onEmail,
  onResume,
}: {
  about: string;
  onEmail: () => void;
  onResume: () => void;
}) {
  const buttons = [
    { label: "Email", onClick: onEmail },
    { label: "LinkedIn", href: "https://linkedin.com/in/henry-kanaskie" },
    { label: "GitHub", href: "https://github.com/henrykanaskie" },
    { label: "Resume", onClick: onResume },
  ];

  return (
    <div className="relative z-[1] w-full flex flex-col items-center gap-6 md:gap-10 pt-6 md:pt-10">
      <GlassTitle
        text="Henry Kanaskie"
        fontSize="clamp(2.6rem, 8.4vw, 8.5rem)"
        containerClassName="!pt-0 !pb-0 md:!pt-2"
        disableEntrance
        noWrap
      />

      <motion.div {...rise(0)} className="w-full max-w-[1180px] px-3 md:px-6">
        <div className={`${glassBoxClassNames} relative rounded-[28px] overflow-hidden`}>
          <GlassLayers />

          {/* Title strip */}
          <div
            className="relative z-[1] mono flex items-center justify-between gap-4 px-5 md:px-8 py-3"
            style={{ fontSize: 11, letterSpacing: "0.16em", color: "var(--ink-3)", borderBottom: "1px solid var(--hair)" }}
          >
            <span>SHEET 00 / ABOUT</span>
            <span className="hidden sm:inline">CORVALLIS, OREGON</span>
          </div>

          <div className="relative z-[1] grid md:grid-cols-[minmax(220px,300px)_1fr] gap-6 md:gap-10 p-5 md:p-8">
            {/* Portrait, framed in metal */}
            <motion.div {...rise(1)} className="mx-auto md:mx-0 w-[min(68vw,280px)] md:w-full">
              <div className="relative rounded-[18px] p-[5px] metal-surface" style={{ textShadow: "none" }}>
                <div className="relative overflow-hidden rounded-[14px]" style={{ aspectRatio: "3 / 4" }}>
                  <Image
                    src="/photography/cs_profile/IMG_4059.jpeg"
                    alt="Henry Kanaskie"
                    fill
                    style={{ objectFit: "cover", objectPosition: "center top" }}
                    sizes="(max-width: 768px) 68vw, 300px"
                    priority
                  />
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col gap-5 min-w-0">
              {/* Spec table */}
              <motion.dl {...rise(2)} className="grid grid-cols-[64px_1fr] md:grid-cols-[80px_1fr] gap-x-4" style={{ borderTop: "1px solid var(--hair)" }}>
                {SPEC.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="mono py-2.5" style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ink-3)", borderBottom: "1px solid var(--hair)" }}>
                      {k.toUpperCase()}
                    </dt>
                    <dd className="py-2 m-0 font-[family-name:var(--font-elevated)]" style={{ fontSize: "clamp(0.92rem, 1.2vw, 1.05rem)", fontWeight: 500, color: "var(--ink)", borderBottom: "1px solid var(--hair)" }}>
                      {v}
                    </dd>
                  </div>
                ))}
              </motion.dl>

              <motion.p
                {...rise(3)}
                className="m-0 font-[family-name:var(--font-elevated)]"
                style={{ fontSize: "clamp(0.95rem, 1.25vw, 1.1rem)", lineHeight: 1.7, color: "var(--ink-2)", letterSpacing: "-0.005em" }}
              >
                {about}
              </motion.p>

              <motion.div {...rise(4)} className="flex flex-wrap gap-2.5 pt-1">
                {buttons.map((b) => {
                  const cls = `${metalClassNames} rounded-full px-5 py-2 font-semibold text-[0.9rem] transition-transform duration-200 hover:-translate-y-px active:translate-y-px cursor-pointer`;
                  return b.href ? (
                    <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer" className={cls}>
                      <span>{b.label}</span>
                    </a>
                  ) : (
                    <button key={b.label} type="button" onClick={b.onClick} className={cls}>
                      <span>{b.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
