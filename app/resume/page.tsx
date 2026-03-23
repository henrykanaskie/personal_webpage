"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import GlassTitle from "@/components/GlassTitle";
import EducationCard from "@/components/EducationCard";
import { cs, themed, glassBoxClassNames } from "@/lib/tokens";
import { GlassLayers, glassStyle, FuzzyText, useIsDark } from "@/lib/glass";

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
      className={`${glassBoxClassNames} ${className}`}
    >
      <GlassLayers />
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
            backgroundImage: themed(isDark, cs.iridescent.dark, cs.iridescent.light),
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
                  backgroundImage: themed(isDark, cs.iridescent.dark, cs.iridescent.light),
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
                    backgroundImage: themed(isDark, cs.bodyShort.dark, cs.bodyShort.light),
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
              <span
                className="text-black/90 dark:text-white/90"
                style={{
                  fontSize: "clamp(0.78rem, 1.05vw, 0.92rem)",
                  fontWeight: 600,
                  lineHeight: 1.55,
                }}
              >
                {bullet}
              </span>
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
              <stop offset="0%" stopColor={themed(isDark, cs.color.dark, cs.color.light)} />
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
                backgroundImage: themed(isDark, cs.iridescent.dark, cs.iridescent.light),
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
              backgroundImage: themed(isDark, cs.bodyShort.dark, cs.bodyShort.light),
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
      "Reduced embedded system development time by 23% by refactoring anti-drone software modules in C and C++ for improved modularity and reuse across future product lines.",
      "Increased automated testing efficiency by over 40% by restructuring the Python-based test framework, reducing manual intervention and accelerating release cycles.",
      "Eliminated a 3+ minute operator workflow by building a full-stack GUI in React and Flask with real-time control of power, tracking, movement, and logging — reducing test-run response time to under 30 seconds.",
    ],
  },
  {
    title: "Undergraduate Researcher – Applied Machine Learning",
    company: "Plasma, Energy, and Space Propulsion Laboratory",
    dates: "May 2024 — Jun 2026",
    location: "Corvallis, OR",
    techStack: "MATLAB, Python, OR-tools",
    bullets: [
      "Sped up impedance matching by 800% by developing an automated capacitor tuning algorithm with Google's OR-tools, dynamically maximizing power coupling and reducing reflected power in RF plasma systems.",
      "Outperformed the industry-standard denoising filter by 80% by engineering a high-performance Python pipeline, extracting high-fidelity thruster health data from high-noise environments.",
      "Accelerated plasma thruster analysis by 120% by implementing parallelized signal processing programs in MATLAB, enabling faster experimental iteration.",
      "Boosted cancer-focused plasma model accuracy by 33% by engineering high-dimensional features from 10M+ data points across diverse treatment parameters.",
    ],
  },
  {
    title: "Undergraduate Researcher",
    company: "Jason Clark Research Group",
    dates: "Feb 2024 — Mar 2025",
    location: "Corvallis, OR",
    techStack: "VHDL, FPGA, Moku",
    bullets: [
      "Enabled nano-ampere signal acquisition for the first time in the lab by developing VHDL modules for FPGA-based DSP, unlocking precise characterization of previously unmeasurable micro-sensors.",
      "Improved sensor stability by integrating artificial damping algorithms via Hardware-in-the-Loop testing with Moku instrumentation, reducing mechanical noise across multiple test configurations.",
      "Accelerated hardware debugging by designing comprehensive VHDL testbenches that simulated and validated signal responses, enabling rapid iterative prototyping.",
    ],
  },
];

const projects: ProjectData[] = [
  {
    title: "Bee Habitat Recommendation System",
    techStack: "Python, React, JavaScript",
    description:
      "Full-stack AI recommendation engine using truncated SVD on Oregon Bee Atlas data to predict bee-flower interactions, enabling data-driven habitat restoration for land managers. Modeled complex ecological relationships via sparse matrix factorization to identify optimal plant species for local bee populations.",
    githubUrl: "#", // TODO: replace with repo URL
    siteUrl: "#", // TODO: replace with live site URL
    thumbnailType: "matrix",
  },
  {
    title: "Character Classification Neural Network — From Scratch",
    techStack: "Python, NumPy, Pandas",
    description:
      "Feed-forward neural network built from scratch in Python — no ML frameworks — implementing backpropagation, weight initialization, and hyperparameter tuning by hand. Achieved 85% test accuracy on EMNIST handwritten characters.",
    githubUrl: "#", // TODO: replace with repo URL
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
              backgroundImage: themed(isDark, cs.bodyShort.dark, cs.bodyShort.light),
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
                      backgroundImage: themed(isDark, cs.iridescentShort.dark, cs.iridescentShort.light),
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
                      backgroundImage: themed(isDark, cs.iridescentShort.dark, cs.iridescentShort.light),
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
