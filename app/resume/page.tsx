"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import GlassTitle from "@/components/GlassTitle";
import EducationCard from "@/components/EducationCard";
import { GlassCard } from "@/lib/glass";
import { useIsDark } from "@/hooks/useIsDark";
import { rise, settle, leave } from "@/lib/motion";
import { EDUCATION, LINKS } from "@/lib/site";

// ─── Section label with divider line ─────────────────────────────────────────

function SectionLabel({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <div className="flex items-center gap-4 px-4 md:px-12 lg:px-20">
      <span className="relative inline-block">
        <span
          className="bg-clip-text text-transparent"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: "var(--title-fill)",
            fontSize: "clamp(0.62rem, 0.85vw, 0.75rem)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </span>
      <div
        style={{
          flex: 1,
          height: 1,
          background: isDark
            ? "linear-gradient(90deg, rgba(180,200,255,0.18), transparent)"
            : "linear-gradient(90deg, rgba(100,115,145,0.18), transparent)",
        }}
      />
    </div>
  );
}

// ─── Tech pill ────────────────────────────────────────────────────────────────

function TechPill({ label }: { label: string }) {
  return (
    <span
      className="text-black/70 dark:text-white/70 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08]"
      style={{ fontSize: 9, fontFamily: "var(--font-elevated)", padding: "2px 6px", borderRadius: 6, letterSpacing: "0.04em" }}
    >
      {label}
    </span>
  );
}

// ─── Experience card ──────────────────────────────────────────────────────────

interface ExperienceData {
  title: string;
  company: string;
  dates: string;
  location: string;
  techStack: string;
  bullets: string[];
}

function ExperienceCard({
  title,
  company,
  dates,
  location,
  techStack,
  bullets,
}: ExperienceData) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={rise.hidden}
      animate={isInView ? rise.shown : rise.hidden}
      exit={leave}
      transition={settle}
    >
      <GlassCard className="p-5 md:p-8">
        {/* Header: title + dates */}
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 mb-2">
          <div>
            <span className="relative inline-block">
              <span
                className="bg-clip-text text-transparent"
                style={{
                  WebkitBackgroundClip: "text",
                  backgroundImage: "var(--title-fill)",
                  fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
                  fontWeight: 700,
                }}
              >
                {title}
              </span>
            </span>
            <div style={{ marginTop: 2 }}>
              <span
                style={{
                  fontSize: "clamp(0.82rem, 1.1vw, 0.95rem)",
                  fontWeight: 500,
                  color: "var(--body-ink)",
                }}
              >
                {company}
              </span>
              <span
                className="text-black/55 dark:text-white/60"
                style={{ fontSize: "0.78rem", marginLeft: 8, fontFamily: "var(--font-elevated)", letterSpacing: "0.02em" }}
              >
                {location}
              </span>
            </div>
          </div>
          <span
            className="text-black/60 dark:text-white/65"
            style={{ fontSize: "clamp(0.7rem, 0.95vw, 0.82rem)" }}
          >
            {dates}
          </span>
        </div>

        {/* Tech tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {techStack
            .split(",")
            .filter((t) => t.trim())
            .map((t) => (
              <TechPill key={t.trim()} label={t.trim()} />
            ))}
        </div>

        {/* Divider */}
        <div className="bg-black/[0.08] dark:bg-white/[0.1]" style={{ height: 1, marginBottom: 10 }} />

        {/* Bullets */}
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
          {bullets.map((bullet, i) => (
            <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span
                className="text-black/40 dark:text-white/45"
                style={{ fontSize: "0.62rem", marginTop: "0.3em", flexShrink: 0 }}
              >
                ▸
              </span>
              <span
                className="text-black/90 dark:text-white/90"
                style={{
                  fontSize: "clamp(0.78rem, 1.05vw, 0.92rem)",
                  fontWeight: 400,
                  lineHeight: 1.55,
                }}
              >
                <span className="relative inline-block">{bullet}</span>
              </span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </motion.div>
  );
}

// ─── Project thumbnails ───────────────────────────────────────────────────────

type ThumbnailType = "matrix" | "confusion";

function Thumbnail({ type, isDark }: { type: ThumbnailType; isDark: boolean }) {
  const accentFill = isDark ? "rgba(180,200,255,0.75)" : "rgba(100,115,145,0.7)";
  const dimFill = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const labelColor = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)";
  const containerStyle: React.CSSProperties = {
    borderRadius: 12,
    marginBottom: 12,
    height: 90,
    overflow: "hidden",
    border: isDark ? "1px solid rgba(180,200,255,0.08)" : "1px solid rgba(100,115,145,0.07)",
    background: isDark
      ? "radial-gradient(ellipse at 50% 50%, rgba(180,200,255,0.05) 0%, rgba(0,0,0,0) 70%)"
      : "radial-gradient(ellipse at 50% 50%, rgba(100,115,145,0.05) 0%, rgba(0,0,0,0) 70%)",
  };

  if (type === "matrix") {
    // Sparse matrix visualization: represents SVD/matrix factorization
    const cols = 9;
    const pattern = [
      [0, 1, 0, 0, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 1, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 1, 0, 0],
      [0, 1, 0, 0, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0, 1, 0, 0],
    ];
    const cw = 12;
    const totalW = cols * cw;
    const startX = (160 - totalW) / 2;
    return (
      <div style={containerStyle}>
        <svg width="100%" height="90" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid meet">
          {pattern.map((row, r) =>
            row.map((filled, c) => (
              <circle
                key={`${r}-${c}`}
                cx={startX + c * cw + 6}
                cy={12 + r * 13}
                r={filled ? 3 : 2}
                fill={filled ? accentFill : dimFill}
              />
            ))
          )}
          <text x="80" y="84" textAnchor="middle" fontSize="6.5" fill={labelColor} fontFamily="monospace" letterSpacing="0.8">
            SPARSE MATRIX · TRUNCATED SVD
          </text>
        </svg>
      </div>
    );
  }

  // confusion: 4×4 confusion matrix, diagonal = correct predictions (bright), off-diag = dim
  const n = 4;
  const cSize = 17;
  const totalW = n * cSize;
  const startX = (160 - totalW) / 2;
  const startY = 8;
  const gradId = "cm-iri";
  return (
    <div style={containerStyle}>
      <svg width="100%" height="90" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={isDark ? "#d6d4cf" : "#3a3834"} />
            <stop offset="100%" stopColor={isDark ? "#8f8b85" : "#6b6760"} />
          </linearGradient>
        </defs>
        {Array.from({ length: n }, (_, r) =>
          Array.from({ length: n }, (_, c) => {
            const onDiag = r === c;
            const nearDiag = Math.abs(r - c) === 1;
            return (
              <rect
                key={`${r}-${c}`}
                x={startX + c * cSize + 1}
                y={startY + r * cSize + 1}
                width={cSize - 2}
                height={cSize - 2}
                rx={2}
                fill={onDiag ? `url(#${gradId})` : dimFill}
                opacity={onDiag ? 0.82 : nearDiag ? 0.6 : 1}
              />
            );
          })
        )}
        <text x="80" y="84" textAnchor="middle" fontSize="6.5" fill={labelColor} fontFamily="monospace" letterSpacing="0.8">
          CONFUSION MATRIX · 85% ACCURACY
        </text>
      </svg>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

interface ProjectData {
  title: string;
  techStack: string;
  description: string;
  githubUrl?: string;
  siteUrl?: string;
  thumbnailType: ThumbnailType;
}

function ResumeProjectCard({
  title,
  techStack,
  description,
  githubUrl,
  siteUrl,
  thumbnailType,
  isDark,
}: ProjectData & { isDark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.1 });
  const hasLinks = githubUrl || siteUrl;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex-1 min-w-0 flex flex-col"
    >
      <GlassCard className="p-5 flex-1 flex flex-col">
        {/* Thumbnail */}
        <Thumbnail type={thumbnailType} isDark={isDark} />

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <span className="relative inline-block">
            <span
              className="bg-clip-text text-transparent"
              style={{
                WebkitBackgroundClip: "text",
                backgroundImage: "var(--title-fill)",
                fontSize: "clamp(0.88rem, 1.3vw, 1.05rem)",
                fontWeight: 700,
              }}
            >
              {title}
            </span>
          </span>
        </div>

        {/* Tech tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginBottom: 10 }}>
          {techStack
            .split(",")
            .filter((t) => t.trim())
            .map((t) => (
              <TechPill key={t.trim()} label={t.trim()} />
            ))}
        </div>

        {/* Description */}
        <span
          style={{
            fontSize: "clamp(0.76rem, 1vw, 0.86rem)",
            fontWeight: 400,
            lineHeight: 1.55,
            display: "block",
            color: "var(--body-ink)",
          }}
        >
          <span className="relative inline-block">{description}</span>
        </span>

        {/* Links */}
        {hasLinks && (
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: "auto", paddingTop: 10 }}>
            {[
              { url: githubUrl, label: "GitHub" },
              { url: siteUrl, label: "Live Site" },
            ].map(
              ({ url, label }) =>
                url && (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                    style={{
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-elevated)",
                      letterSpacing: "0.04em",
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                      color: isDark ? "rgba(180,200,255,0.75)" : "rgba(80,95,130,0.8)",
                    }}
                  >
                    {label}
                  </a>
                ),
            )}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const experiences: ExperienceData[] = [
  // TODO(henry): fill in title, dates, location and stack once they're public.
  {
    title: "Intern",
    company: "Daimler Truck North America",
    dates: "Now",
    location: "",
    techStack: "",
    bullets: [
      "Joining the company behind Freightliner as an intern. Details to follow once there's work I can talk about.",
    ],
  },
  {
    title: "Software Engineering Intern",
    company: "DZYNE Technologies",
    dates: "Mar 2025 - Sep 2025",
    location: "Portland, OR",
    techStack: "Python, C, C++, SQL, React, Flask",
    bullets: [
      "23% faster embedded development after refactoring anti-drone C/C++ modules for modularity and reuse across product lines.",
      "Restructured the Python test framework to eliminate manual intervention, lifting automated testing efficiency by over 40% and tightening release cycles.",
      "A full-stack React/Flask GUI replaced a 3+ minute manual operator workflow, delivering real-time control of power, tracking, movement, and logging with sub-30-second test runs.",
    ],
  },
  {
    title: "Undergraduate Researcher – Applied Machine Learning",
    company: "Plasma, Energy, and Space Propulsion Laboratory",
    dates: "May 2024 - Jun 2026",
    location: "Corvallis, OR",
    techStack: "MATLAB, Python, OR-tools",
    bullets: [
      "Capacitor tuning algorithm built with Google OR-tools to dynamically maximize power coupling in RF plasma systems, delivering an 800% speedup over manual impedance matching.",
      "Industry-standard denoising filter outperformed by 80% with a custom Python pipeline that reliably extracts thruster health data from high-noise environments.",
      "120% faster plasma thruster analysis through parallelized MATLAB signal processing, enabling tighter experimental iteration.",
      "High-dimensional features engineered from 10M+ data points across diverse treatment parameters boosted a cancer-focused plasma model's accuracy by 33%.",
    ],
  },
  {
    title: "Undergraduate Researcher",
    company: "Jason Clark Research Group",
    dates: "Feb 2024 - Mar 2025",
    location: "Corvallis, OR",
    techStack: "VHDL, FPGA, Moku",
    bullets: [
      "First-ever nano-ampere signal acquisition in the lab, enabled by VHDL modules developed for FPGA-based DSP and unlocking characterization of previously unmeasurable micro-sensors.",
      "Integrated artificial damping algorithms through Hardware-in-the-Loop testing with Moku instrumentation, stabilizing sensors and reducing mechanical noise across multiple test configurations.",
      "Comprehensive VHDL testbenches simulating and validating signal responses shortened hardware debug cycles and enabled rapid iterative prototyping.",
    ],
  },
];

const projects: ProjectData[] = [
  {
    title: "Bee Habitat Recommendation System",
    techStack: "Python, React, JavaScript",
    description:
      "Full-stack AI recommendation engine using truncated SVD on Oregon Bee Atlas data to predict bee-flower interactions, enabling data-driven habitat restoration for land managers. Modeled complex ecological relationships via sparse matrix factorization to identify optimal plant species for local bee populations.",
    githubUrl: "https://github.com/Kellen-Sullivan/bee-plant-data-exploration",
    siteUrl: "https://kellen-sullivan.github.io/bee-plant-data-exploration/",
    thumbnailType: "matrix",
  },
  {
    title: "Character Classification Neural Network: From Scratch",
    techStack: "Python, NumPy, Pandas",
    description:
      "Feed-forward neural network built from scratch in Python (no ML frameworks), implementing backpropagation, weight initialization, and hyperparameter tuning by hand. Achieved 85% test accuracy on EMNIST handwritten characters.",
    githubUrl: "https://github.com/henrykanaskie/emnist",
    thumbnailType: "confusion",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResumePage() {
  const isDark = useIsDark();

  return (
    <div className="flex flex-col gap-10 md:gap-16 pb-[10vh]">
      <GlassTitle text="Resume" />
      <motion.div
        initial={rise.hidden}
        animate={rise.shown}
        exit={leave}
        transition={{ ...settle, delay: 0.1 }}
        className="-mt-4 md:-mt-20 flex flex-col items-center gap-4"
      >
        {/* Tagline */}
        <span className="relative inline-block">
          <span
            className="bg-clip-text text-transparent text-center block"
            style={{
              WebkitBackgroundClip: "text",
              backgroundImage: "var(--body-fill)",
              fontSize: "clamp(0.88rem, 1.3vw, 1.05rem)",
              fontWeight: 500,
            }}
          >
            CS master&apos;s student at Oregon State · Applied ML &amp; Systems Programming
          </span>
        </span>

        {/* Contact links */}
        <div className="flex items-center">
          {[
            { label: "LinkedIn", href: LINKS.linkedin },
            { label: "GitHub", href: LINKS.github },
            { label: "Email", href: LINKS.email },
          ].map((item, i, arr) => (
            <span key={item.label} className="flex items-center">
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity"
                style={{ fontSize: "clamp(1rem, 1.6vw, 1.3rem)", fontWeight: 600 }}
              >
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: "var(--title-fill)",
                  }}
                >
                  {item.label}
                </span>
              </a>
              {i < arr.length - 1 && (
                <span
                  className="mx-5 inline-block"
                  style={{
                    width: 1,
                    height: "1em",
                    background: isDark
                      ? "linear-gradient(180deg, transparent, rgba(180,200,255,0.3), transparent)"
                      : "linear-gradient(180deg, transparent, rgba(100,115,145,0.25), transparent)",
                  }}
                />
              )}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── Experience ── */}
      <div className="flex flex-col gap-4 md:gap-5">
        <SectionLabel label="Experience" isDark={isDark} />
        <div className="flex flex-col gap-4 px-4 md:px-12 lg:px-20">
          {experiences.map((exp) => (
            <ExperienceCard key={exp.company + exp.dates} {...exp} />
          ))}
        </div>
      </div>

      {/* ── Projects ── */}
      <div className="flex flex-col gap-4 md:gap-5">
        <SectionLabel label="Projects" isDark={isDark} />
        <div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-5 px-4 md:px-12 lg:px-20">
          {projects.map((proj) => (
            <ResumeProjectCard key={proj.title} {...proj} isDark={isDark} />
          ))}
        </div>
      </div>

      {/* ── Education ── */}
      <div className="flex flex-col gap-4 md:gap-5">
        <SectionLabel label="Education" isDark={isDark} />
        <EducationCard {...EDUCATION} />
      </div>

      <div style={{ height: 60 }} />
    </div>
  );
}
