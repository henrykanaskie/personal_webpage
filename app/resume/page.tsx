"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import GlassTitle from "@/components/GlassTitle";
import EducationCard from "@/components/EducationCard";
import { glassClassNames, FuzzyText } from "@/components/LeftInfoBox";
import { glassStyle, useIsDark } from "@/components/InfoBubble";

// ─── Gradient constants ───────────────────────────────────────────────────────

const iriDark = `linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)`;
const iriLight = `linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)`;
const bodyDark = `linear-gradient(135deg, rgba(248,250,255,0.96) 0%, rgba(255,248,255,0.93) 50%, rgba(248,250,255,0.95) 100%)`;
const bodyLight = `linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(25,15,35,0.92) 50%, rgba(12,18,30,0.94) 100%)`;

// ─── Glass card shell ─────────────────────────────────────────────────────────

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      style={{ position: "relative", borderRadius: "24px", ...glassStyle }}
      className={`${glassClassNames} ${className}`}
    >
      {/* Specular top */}
      <div
        className="dark:hidden"
        style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 70%, transparent)", borderRadius: "inherit", pointerEvents: "none", zIndex: 1 }}
      />
      <div
        className="hidden dark:block"
        style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 70%, transparent)", borderRadius: "inherit", pointerEvents: "none", zIndex: 1 }}
      />
      {/* Specular bottom */}
      <div
        className="dark:hidden"
        style={{ position: "absolute", bottom: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.04) 70%, transparent)", borderRadius: "inherit", pointerEvents: "none", zIndex: 1 }}
      />
      <div
        className="hidden dark:block"
        style={{ position: "absolute", bottom: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.2) 70%, transparent)", borderRadius: "inherit", pointerEvents: "none", zIndex: 1 }}
      />
      {/* Chromatic aberration */}
      <div style={{ position: "absolute", top: -1, left: -1, right: -1, bottom: -1, borderRadius: "inherit", pointerEvents: "none", zIndex: 0, boxShadow: "inset 2px 0 8px rgba(255,0,80,0.04), inset -2px 0 8px rgba(0,100,255,0.04), inset 0 2px 8px rgba(255,200,0,0.03), inset 0 -2px 8px rgba(0,200,255,0.03)" }} />
      {/* Internal refraction */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.02) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200,220,255,0.05) 0%, transparent 50%)" }} />
      {/* Edge distortion */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", zIndex: 0, WebkitMaskImage: "radial-gradient(ellipse at center, transparent 55%, black 100%)", maskImage: "radial-gradient(ellipse at center, transparent 55%, black 100%)", backdropFilter: "blur(3px) saturate(1.1)", WebkitBackdropFilter: "blur(3px) saturate(1.1)" }} />
      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── Section label with divider line ─────────────────────────────────────────

function SectionLabel({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <div className="flex items-center gap-4 px-4 md:px-12 lg:px-20">
      <FuzzyText>
        <span
          className="bg-clip-text text-transparent"
          style={{
            WebkitBackgroundClip: "text",
            backgroundImage: isDark ? iriDark : iriLight,
            fontSize: "clamp(0.62rem, 0.85vw, 0.75rem)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </FuzzyText>
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
      style={{ fontSize: 9, fontFamily: "monospace", padding: "2px 6px", borderRadius: 6, letterSpacing: "0.02em" }}
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
  isDark,
}: ExperienceData & { isDark: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ x: "-70vw", opacity: 0 }}
      animate={isInView ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
      exit={{ x: "-70vw", opacity: 0, transition: { duration: 0.55, ease: [0.5, 0, 0.75, 0] } }}
      transition={{ duration: 1.0, ease: "easeOut" }}
    >
      <GlassCard className="p-5 md:p-8">
        {/* Header: title + dates */}
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 mb-2">
          <div>
            <FuzzyText>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  WebkitBackgroundClip: "text",
                  backgroundImage: isDark ? iriDark : iriLight,
                  fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
                  fontWeight: 700,
                }}
              >
                {title}
              </span>
            </FuzzyText>
            <div style={{ marginTop: 2 }}>
              <FuzzyText>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: isDark ? bodyDark : bodyLight,
                    fontSize: "clamp(0.82rem, 1.1vw, 0.95rem)",
                    fontWeight: 600,
                  }}
                >
                  {company}
                </span>
              </FuzzyText>
              <span
                className="text-black/55 dark:text-white/60"
                style={{ fontSize: "0.78rem", marginLeft: 8, fontFamily: "monospace" }}
              >
                {location}
              </span>
            </div>
          </div>
          <FuzzyText>
            <span
              className="text-black/60 dark:text-white/65"
              style={{ fontSize: "clamp(0.7rem, 0.95vw, 0.82rem)", fontFamily: "monospace" }}
            >
              {dates}
            </span>
          </FuzzyText>
        </div>

        {/* Tech tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {techStack.split(",").map((t) => (
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
              <FuzzyText>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: isDark ? bodyDark : bodyLight,
                    fontSize: "clamp(0.78rem, 1.05vw, 0.92rem)",
                    fontWeight: 600,
                    lineHeight: 1.55,
                  }}
                >
                  {bullet}
                </span>
              </FuzzyText>
            </li>
          ))}
        </ul>
      </GlassCard>
    </motion.div>
  );
}

// ─── Project thumbnails ───────────────────────────────────────────────────────

type ThumbnailType = "matrix" | "confusion" | "terminal";

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
    // Sparse matrix visualization — represents SVD/matrix factorization
    const cols = 9;
    const rows = 5;
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

  if (type === "confusion") {
    // 4×4 confusion matrix — diagonal = correct predictions (bright), off-diag = dim
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
              <stop offset="0%" stopColor={isDark ? "rgb(180,200,255)" : "rgb(100,115,145)"} />
              <stop offset="100%" stopColor={isDark ? "rgb(210,185,230)" : "rgb(125,110,135)"} />
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

  // terminal — represents POSIX shell / systems programming
  const lines = [
    { text: "$ ./smallsh", color: isDark ? "rgba(180,200,255,0.85)" : "rgba(100,115,145,0.85)" },
    { text: "> ls -la /proc", color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)" },
    { text: "> echo $$  → 4821", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)" },
    { text: "> ^C  (SIGINT caught)", color: isDark ? "rgba(255,160,160,0.6)" : "rgba(180,60,60,0.55)" },
    { text: "$ _", color: isDark ? "rgba(180,200,255,0.6)" : "rgba(100,115,145,0.6)" },
  ];
  return (
    <div
      style={{
        ...containerStyle,
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 3,
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{ fontFamily: "monospace", fontSize: "0.6rem", color: line.color, letterSpacing: "0.02em" }}
        >
          {line.text}
        </div>
      ))}
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
          <FuzzyText>
            <span
              className="bg-clip-text text-transparent"
              style={{
                WebkitBackgroundClip: "text",
                backgroundImage: isDark ? iriDark : iriLight,
                fontSize: "clamp(0.88rem, 1.3vw, 1.05rem)",
                fontWeight: 700,
              }}
            >
              {title}
            </span>
          </FuzzyText>
        </div>

        {/* Tech tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginBottom: 10 }}>
          {techStack.split(",").map((t) => (
            <TechPill key={t.trim()} label={t.trim()} />
          ))}
        </div>

        {/* Description */}
        <FuzzyText style={{ display: "block" }}>
          <span
            className="bg-clip-text text-transparent"
            style={{
              WebkitBackgroundClip: "text",
              backgroundImage: isDark ? bodyDark : bodyLight,
              fontSize: "clamp(0.76rem, 1vw, 0.86rem)",
              fontWeight: 600,
              lineHeight: 1.55,
              display: "block",
            }}
          >
            {description}
          </span>
        </FuzzyText>

        {/* Links */}
        {hasLinks && (
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: "auto", paddingTop: 10 }}>
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                style={{
                  fontSize: "0.72rem",
                  fontFamily: "monospace",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  color: isDark ? "rgba(180,200,255,0.75)" : "rgba(80,95,130,0.8)",
                }}
              >
                GitHub
              </a>
            )}
            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                style={{
                  fontSize: "0.72rem",
                  fontFamily: "monospace",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  color: isDark ? "rgba(180,200,255,0.75)" : "rgba(80,95,130,0.8)",
                }}
              >
                Live Site
              </a>
            )}
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const experiences: ExperienceData[] = [
  {
    title: "Software Engineering Intern",
    company: "DZYNE Technologies",
    dates: "Mar 2025 — Sep 2025",
    location: "Portland, OR",
    techStack: "Python, C, C++, SQL, React, Flask",
    bullets: [
      "Cut embedded development time by 23% by refactoring anti-drone C/C++ modules for modularity and cross-product reuse",
      "Boosted automated test coverage by 40%+ by rewriting the Python testing pipeline with structured reporting",
      "Reduced operator response time by building a real-time React/Flask control GUI for power, tracking, movement, and logging",
    ],
  },
  {
    title: "Undergraduate Researcher",
    company: "Plasma, Energy & Space Propulsion Lab",
    dates: "May 2024 — Jun 2026",
    location: "Corvallis, OR",
    techStack: "Python, MATLAB, OR-tools",
    bullets: [
      "Sped up impedance-matching pipeline by 800% via a Google OR-tools capacitor-network algorithm",
      "Extracted high-fidelity thruster diagnostic signals from noisy plasma environments with a custom Python denoising pipeline",
      "Improved cancer-focused plasma model accuracy by 33% by engineering high-dimensional features from 10M+ data points",
    ],
  },
  {
    title: "Undergraduate Researcher",
    company: "Jason Clark Research Group",
    dates: "Feb 2024 — Mar 2025",
    location: "Corvallis, OR",
    techStack: "VHDL, FPGA, Moku",
    bullets: [
      "Achieved high-fidelity nano-ampere acquisition for micro-sensor characterization via FPGA-based VHDL DSP modules",
      "Shortened hardware debug cycles by accelerating iterative prototyping with comprehensive VHDL testbenches",
      "Improved sensor stability via artificial damping algorithms tested with Hardware-in-the-Loop Moku instrumentation",
    ],
  },
];

const projects: ProjectData[] = [
  {
    title: "Bee Habitat Recommendation System",
    techStack: "Python, React, JavaScript",
    description:
      "ML recommendation engine using truncated SVD to match plant species with local bee populations from Oregon Bee Atlas data. Full-stack: React frontend, Python backend.",
    githubUrl: "#", // TODO: replace with repo URL
    siteUrl: "#", // TODO: replace with live site URL
    thumbnailType: "matrix",
  },
  {
    title: "Character Classification Neural Net",
    techStack: "Python, NumPy, Pandas",
    description:
      "Feed-forward neural network built from scratch — custom backpropagation and gradient descent, no ML frameworks. 85% accuracy on EMNIST handwritten characters.",
    githubUrl: "#", // TODO: replace with repo URL
    thumbnailType: "confusion",
  },
  {
    title: "Small Shell",
    techStack: "C, Linux",
    description:
      "Interactive POSIX shell with command execution, I/O redirection, background processes, and custom SIGINT/SIGTSTP signal handling. Systems programming from first principles.",
    githubUrl: "#", // TODO: replace with repo URL
    thumbnailType: "terminal",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResumePage() {
  const isDark = useIsDark();

  return (
    <div className="flex flex-col gap-10 md:gap-16 pb-[10vh]">
      {/* ── Intro ── */}
      <GlassTitle text="Henry Kanaskie" />

      <motion.div
        initial={{ opacity: 0, x: "70vw" }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ x: "70vw", transition: { duration: 0.55, ease: [0.5, 0, 0.75, 0] } }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="-mt-4 md:-mt-20 flex flex-col items-center gap-4"
      >
        {/* Tagline */}
        <FuzzyText>
          <span
            className="bg-clip-text text-transparent text-center block"
            style={{
              WebkitBackgroundClip: "text",
              backgroundImage: isDark ? bodyDark : bodyLight,
              fontSize: "clamp(0.88rem, 1.3vw, 1.05rem)",
              fontWeight: 500,
            }}
          >
            CS honors student at Oregon State · Applied ML &amp; Systems Programming
          </span>
        </FuzzyText>

        {/* Contact links */}
        <div className="flex items-center">
          {[
            { label: "LinkedIn", href: "https://linkedin.com/in/henry-kanaskie", external: true },
            { label: "GitHub", href: "https://github.com/henrykanaskie", external: true },
            { label: "Email", href: "/about", external: false },
          ].map((item, i, arr) => (
            <span key={item.label} className="flex items-center">
              {item.external ? (
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
                      backgroundImage: isDark
                        ? "linear-gradient(135deg, rgb(180,200,255), rgb(210,185,230))"
                        : "linear-gradient(135deg, rgb(100,115,145), rgb(125,110,135))",
                    }}
                  >
                    {item.label}
                  </span>
                </a>
              ) : (
                <Link
                  href={item.href}
                  scroll={false}
                  className="hover:opacity-70 transition-opacity"
                  style={{ fontSize: "clamp(1rem, 1.6vw, 1.3rem)", fontWeight: 600 }}
                >
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      WebkitBackgroundClip: "text",
                      backgroundImage: isDark
                        ? "linear-gradient(135deg, rgb(180,200,255), rgb(210,185,230))"
                        : "linear-gradient(135deg, rgb(100,115,145), rgb(125,110,135))",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              )}
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
            <ExperienceCard key={exp.company + exp.dates} {...exp} isDark={isDark} />
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
        <EducationCard
          school="Oregon State University"
          degree="Honors B.S. Computer Science"
          timeline="Sep 2022 — Jun 2026"
          gpa="3.95 / 4.0"
          coursework={[
            "Data Structures & Algorithms",
            "Databases",
            "Software Engineering",
            "Artificial Intelligence",
            "Machine Learning",
            "Deep Learning",
          ]}
        />
      </div>

      <div style={{ height: 60 }} />
    </div>
  );
}
