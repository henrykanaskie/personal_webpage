"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import GlassTitle from "@/components/GlassTitle";
import {
  GlassLayers,
  glassStyle,
  FuzzyText,
  useIsDark,
  useIsMobile,
} from "@/lib/glass";
import {
  cs,
  themed,
  glassBoxClassNames,
  glassBubbleClassNames,
} from "@/lib/tokens";
import { CrystallineText } from "@/components/Header";
import InfoBox from "@/components/InfoBox";
import AboutBlurb from "@/components/AboutBlurb";
import ProjectCard from "@/components/ProjectCard";
import EducationCard from "@/components/EducationCard";
import { rocketPaths } from "@/svgs/rocketPaths";
import { fpgaPaths } from "@/svgs/fpgaPaths";
import { dronesPaths } from "@/svgs/dronesPaths";
import { thrusterPaths } from "@/svgs/thrusterPaths";
import { cpuPaths } from "@/svgs/cpuPaths";
import { beePaths } from "@/svgs/beePaths";
import { nnPaths } from "@/svgs/nnPaths";

// ── Section divider ───────────────────────────────────────────────────────────
function SectionDivider() {
  const isDark = useIsDark();
  return (
    <div className="w-full px-[8%] my-8 md:my-16">
      <div
        style={{
          height: "1px",
          background: isDark
            ? "linear-gradient(90deg, transparent, rgba(180,200,255,0.15) 30%, rgba(200,185,225,0.2) 50%, rgba(180,200,255,0.15) 70%, transparent)"
            : "linear-gradient(90deg, transparent, rgba(22,90,139,0.45) 30%, rgba(22,90,139,0.58) 50%, rgba(22,90,139,0.45) 70%, transparent)",
        }}
      />
    </div>
  );
}

// ── Projects helpers ──────────────────────────────────────────────────────────
function splitIntoRows<T>(items: T[]): T[][] {
  const n = items.length;
  if (n <= 3) return [items];
  const topCount = Math.floor(n / 2);
  return [items.slice(0, topCount), items.slice(topCount)];
}

const projects = [
  {
    title: "Bee Habitat Recommendation System",
    techStack: "Python, React, JavaScript",
    description:
      "Oregon's native bee populations are declining, and the hardest part of habitat restoration is knowing which plants to actually put in the ground. This project tackled that problem by building a recommendation engine on top of the Oregon Bee Atlas that models bee-flower relationships as a sparse matrix and uses truncated SVD to surface the most ecologically relevant plant species for a given area. The goal was a tool land managers could actually use to make decisions.",
    deployment: { progress: 100 },
    svgs: [
      {
        paths: beePaths,
        corner: "top-left" as const,
        size: 75,
        rotate: -10,
        offset: { x: 25, y: -20 },
        drawDuration: 3,
      },
    ],
  },
  {
    title: "Character Classification Neural Network — From Scratch",
    techStack: "Python, NumPy, Pandas",
    description:
      "The goal here was understanding. I didn't want to just get a model to work, but know exactly why it works. I built a feed-forward neural network entirely from scratch, implementing backpropagation, weight initialization, and the full training loop without touching any ML frameworks. Training it on EMNIST handwritten characters and hitting 85% test accuracy was the payoff, but the real value was the intuition built along the way.",
    deployment: { progress: 100 },
    svgs: [
      {
        paths: nnPaths,
        corner: "top-right" as const,
        size: 60,
        rotate: 0,
        offset: { x: -10, y: 10 },
        drawDuration: 4,
      },
    ],
  },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CSPage() {
  const isDark = useIsDark();
  const isMobile = useIsMobile(850);

  // Active section for nav dots
  const [activeSection, setActiveSection] = useState("about");
  const [hasScrolled, setHasScrolled] = useState(false);
  // Direct DOM ref for the progress fill — avoids re-renders on every scroll tick
  const navFillRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sectionIds = ["about", "experience", "projects", "education"];
    const N = sectionIds.length;

    // Cache section positions — only recomputed on resize, not on every scroll
    let sectionTops: number[] = new Array(N).fill(0);
    let lastSectionBottom = 0;

    const measureSections = () => {
      const scrollY = window.scrollY;
      sectionTops = sectionIds.map((id) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + scrollY : 0;
      });
      const lastEl = document.getElementById(sectionIds[N - 1]);
      lastSectionBottom = lastEl
        ? lastEl.getBoundingClientRect().bottom + scrollY
        : sectionTops[N - 1] + window.innerHeight;
    };

    const updateNav = () => {
      const scrollY = window.scrollY;
      const viewportMid = scrollY + window.innerHeight * 0.5;

      if (scrollY > 80) setHasScrolled(true);

      // Active section: highest top that is <= viewport center
      let activeIdx = 0;
      for (let i = 0; i < N; i++) {
        if (sectionTops[i] <= viewportMid) activeIdx = i;
      }
      setActiveSection(sectionIds[activeIdx]);

      // Progress bar — pure math, no DOM reads
      const currentTop = sectionTops[activeIdx];
      const nextTop =
        activeIdx < N - 1 ? sectionTops[activeIdx + 1] : lastSectionBottom;
      const fraction =
        nextTop > currentTop
          ? Math.max(
              0,
              Math.min(1, (viewportMid - currentTop) / (nextTop - currentTop)),
            )
          : 0;
      const progress = Math.max(
        0,
        Math.min(1, (activeIdx + fraction) / (N - 1)),
      );
      if (navFillRef.current) {
        navFillRef.current.style.height = `calc(${progress * 100}% - ${progress * 15}px)`;
      }
    };

    measureSections();
    updateNav();

    const onResize = () => {
      measureSections();
      updateNav();
    };
    window.addEventListener("scroll", updateNav, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateNav);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // About section viewport refs for fade-in/out animations
  const contactRef = useRef<HTMLDivElement>(null);
  const contactInView = useInView(contactRef, {
    once: true,
    amount: 0.15,
  });

  // About section modal state
  const [resumeOpen, setResumeOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  // Notify header to hide nav when a modal is open
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("csModal", { detail: { open: resumeOpen || emailOpen } }),
    );
  }, [resumeOpen, emailOpen]);
  const [emailForm, setEmailForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const emailFormOpenedAt = useRef(0);
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [emailError, setEmailError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!emailForm.name.trim()) errs.name = "Name is required";
    if (!emailForm.email.trim()) errs.email = "Email is required";
    else if (!validateEmail(emailForm.email))
      errs.email = "Enter a valid email";
    if (!emailForm.subject.trim()) errs.subject = "Subject is required";
    if (!emailForm.message.trim()) errs.message = "Message is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setEmailStatus("sending");
    setEmailError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...emailForm,
            website: honeypot,
            formOpenedAt: emailFormOpenedAt.current,
          }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailStatus("error");
        setEmailError(data.error || "Failed to send.");
        return;
      }
      setEmailStatus("sent");
      setEmailForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setEmailStatus("error");
      setEmailError("Something went wrong.");
    }
  };

  // Scroll to a section after navigating from another page (e.g. from /resume).
  // Do NOT rely on URL hashes (mobile can preserve them and cause random jumps).
  useEffect(() => {
    if (typeof window === "undefined") return;
    history.scrollRestoration = "manual";

    // Clear any stale hash so it can't trigger browser anchor behavior.
    if (window.location.hash) {
      history.replaceState(null, "", "/cs");
    }

    const targetId = sessionStorage.getItem("csScrollTo");
    sessionStorage.removeItem("csScrollTo");

    if (targetId) {
      setTimeout(() => {
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: "smooth" });
      }, 350);
    } else {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant" as ScrollBehavior,
      });
    }
  }, []);

  const rows = splitIntoRows([...projects]);

  return (
    <div>
      {/* ── Section indicator ───────────────────────────────────────────── */}
      <div
        className="hidden md:flex flex-col items-center"
        style={{
          position: "fixed",
          right: 18,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 40,
          gap: 0,
        }}
      >
        {/* Morphing section name */}
        <div
          style={{
            marginBottom: 14,
            height: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={activeSection}
              initial={{ opacity: 0, filter: "blur(8px)", y: -4 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(8px)", y: 4 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 700,
                backgroundImage: themed(
                  isDark,
                  cs.liquidGlass.dark,
                  cs.liquidGlass.light,
                ),
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "none",
              }}
            >
              {activeSection}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Dots + progress track */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* Background track */}
          <div
            style={{
              position: "absolute",
              top: "7.5px",
              bottom: "7.5px",
              left: "50%",
              width: 1,
              transform: "translateX(-50%)",
              background: isDark
                ? "rgba(180,200,255,0.08)"
                : "rgba(100,115,145,0.08)",
            }}
          />
          {/* Glowing fill */}
          <div
            ref={navFillRef}
            style={{
              position: "absolute",
              top: "7.5px",
              left: "50%",
              width: 1,
              height: "0%",
              transform: "translateX(-50%)",
              background: isDark
                ? "linear-gradient(to bottom, rgba(180,200,255,0.9), rgba(210,185,230,0.7))"
                : "linear-gradient(to bottom, rgba(100,115,145,0.8), rgba(125,110,135,0.6))",
              boxShadow: isDark
                ? "0 0 4px rgba(180,200,255,0.7), 0 0 10px rgba(210,185,230,0.35)"
                : "0 0 4px rgba(100,115,145,0.55), 0 0 8px rgba(125,110,135,0.3)",
            }}
          />
          {/* Dots */}
          {(["about", "experience", "projects", "education"] as const).map(
            (id) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  onClick={() =>
                    document
                      .getElementById(id)
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  style={{
                    position: "relative",
                    zIndex: 1,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <motion.div
                    animate={{
                      width: isActive ? 7 : 3,
                      height: isActive ? 7 : 3,
                      opacity: isActive ? 1 : 0.22,
                      boxShadow: isActive
                        ? isDark
                          ? "0 0 8px rgba(180,200,255,0.9), 0 0 18px rgba(210,185,230,0.5)"
                          : "0 0 8px rgba(100,115,145,0.7), 0 0 14px rgba(125,110,135,0.35)"
                        : "none",
                    }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    style={{
                      borderRadius: "50%",
                      backgroundImage: themed(
                        isDark,
                        cs.iridescentShort.dark,
                        cs.iridescentShort.light,
                      ),
                    }}
                  />
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* ── About ──────────────────────────────────────────────────────── */}
      <section
        id="about"
        style={{ scrollMarginTop: "80px" }}
        className="flex flex-col items-center gap-12 md:gap-28 pb-[5vh]"
      >
        {/* Single row: Photo + Name/Links + Bio */}
        <motion.div
          ref={contactRef}
          initial={{ opacity: 0 }}
          animate={contactInView ? { opacity: 1 } : { opacity: 0 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.55, ease: [0.5, 0, 0.75, 0] },
          }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            minHeight: isMobile ? undefined : "400px",
            gap: "clamp(1rem, 3vw, 2.5rem)",
          }}
          className="w-full px-2 md:px-[5%] pt-8 md:pt-14"
        >
          {isMobile ? (
            /* ── Mobile layout ── */
            <div className="flex flex-col gap-5 w-full">
              {/* Name */}
              <GlassTitle
                text="Henry Kanaskie"
                variant="crystalline"
                containerClassName="justify-center items-center !pt-0 !pb-0"
                fontSize="clamp(2rem, 11vw, 3.5rem)"
              />

              {/* Photo — with side margins */}
              <div
                style={{
                  position: "relative",
                  width: "clamp(200px, 50vw, 300px)",
                  alignSelf: "center",
                  aspectRatio: "3 / 4",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
                  boxShadow: isDark
                    ? "0 4px 32px rgba(0,0,0,0.55)"
                    : "0 2px 16px rgba(0,0,0,0.12)",
                }}
              >
                <Image
                  src="/photography/cs_profile/IMG_4059.jpeg"
                  alt="Henry Kanaskie"
                  fill
                  style={{ objectFit: "cover", objectPosition: "center top" }}
                  sizes="100vw"
                  priority={false}
                />
              </div>

              {/* Links */}
              <div className="flex flex-row justify-center items-center gap-2 flex-wrap">
                {[
                  {
                    label: "Email",
                    href: undefined,
                    action: () => {
                      setEmailOpen(true);
                      setEmailStatus("idle");
                      emailFormOpenedAt.current = Date.now();
                    },
                  },
                  {
                    label: "LinkedIn",
                    href: "https://linkedin.com/in/henry-kanaskie",
                    action: undefined,
                  },
                  {
                    label: "Resume",
                    href: undefined,
                    action: () => setResumeOpen(true),
                  },
                ].map((item) => {
                  const pillClassName = `${glassBubbleClassNames} rounded-full font-semibold transition-all duration-200 hover:scale-105 active:scale-95`;
                  const pillStyle: React.CSSProperties = {
                    ...glassStyle,
                    fontSize: "0.85rem",
                    padding: "0.35rem 0.85rem",
                    whiteSpace: "nowrap",
                  };
                  const label = (
                    <CrystallineText isDark={isDark}>
                      {item.label}
                    </CrystallineText>
                  );
                  return item.href ? (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={pillStyle}
                      className={pillClassName}
                    >
                      {label}
                    </a>
                  ) : (
                    <button
                      key={item.label}
                      onClick={item.action}
                      style={pillStyle}
                      className={`${pillClassName} cursor-pointer`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Blurb */}
              <AboutBlurb
                about={
                  "Hey there! My name's Henry. I'm a Computer Science honors student at Oregon State University, passionate about machine learning, space, and medicine. I love working on software and impactful technology that helps people. I'm driven by problems where computation meets real-world change and improvement. Outside of engineering, I'm usually behind a camera, on the slopes, lifting, or finding new music. I value growth and learning above everything, and I'm always excited to connect with others who share that mindset!"
                }
              />
            </div>
          ) : (
            /* ── Desktop layout ── */
            <>
              {/* Left column — photo + links stacked */}
              <div
                className="flex flex-col gap-3 shrink-0 items-center"
                style={{ width: "300px" }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "300px",
                    height: "400px",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
                    boxShadow: isDark
                      ? "0 4px 32px rgba(0,0,0,0.55)"
                      : "0 2px 16px rgba(0,0,0,0.12)",
                  }}
                >
                  <Image
                    src="/photography/cs_profile/IMG_4059.jpeg"
                    alt="Henry Kanaskie"
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="300px"
                    priority={false}
                  />
                </div>

                {/* Link bubbles under photo */}
                <div className="flex flex-row items-center justify-center gap-2 flex-wrap w-full">
                  {[
                    {
                      label: "Email",
                      href: undefined,
                      action: () => {
                        setEmailOpen(true);
                        setEmailStatus("idle");
                        emailFormOpenedAt.current = Date.now();
                      },
                    },
                    {
                      label: "LinkedIn",
                      href: "https://linkedin.com/in/henry-kanaskie",
                      action: undefined,
                    },
                    {
                      label: "Resume",
                      href: undefined,
                      action: () => setResumeOpen(true),
                    },
                  ].map((item) => {
                    const pillClassName = `${glassBubbleClassNames} rounded-full font-semibold transition-all duration-200 hover:scale-105 active:scale-95`;
                    const pillStyle: React.CSSProperties = {
                      ...glassStyle,
                      fontSize: "0.8rem",
                      padding: "0.3rem 0.9rem",
                      whiteSpace: "nowrap",
                    };
                    const label = (
                      <CrystallineText isDark={isDark}>
                        {item.label}
                      </CrystallineText>
                    );
                    return item.href ? (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={pillStyle}
                        className={pillClassName}
                      >
                        {label}
                      </a>
                    ) : (
                      <button
                        key={item.label}
                        onClick={item.action}
                        style={pillStyle}
                        className={`${pillClassName} cursor-pointer`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right column — name top, blurb bottom */}
              <div
                className="flex flex-col gap-4 flex-1 min-w-0"
                style={{ minHeight: "400px" }}
              >
                {/* Name */}
                <div className="shrink-0">
                  <GlassTitle
                    text="Henry Kanaskie"
                    variant="crystalline"
                    containerClassName="justify-start items-start !pt-0 md:!pt-0 !pb-0 md:!pb-0"
                    fontSize="clamp(2.4rem, 7.5vw, 10rem)"
                    noWrap
                  />
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Blurb */}
                <div>
                  <AboutBlurb
                    about={
                      "Hey there! My name's Henry. I'm a Computer Science honors student at Oregon State University, passionate about machine learning, space, and medicine. I love working on software and impactful technology that helps people. I'm driven by problems where computation meets real-world change and improvement. Outside of engineering, I'm usually behind a camera, on the slopes, lifting, or finding new music. I value growth and learning above everything, and I'm always excited to connect with others who share that mindset!"
                    }
                  />
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          animate={{ opacity: hasScrolled ? 0 : 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-1 pointer-events-none select-none -mt-6 md:-mt-14"
          style={{ opacity: 1 }}
        >
          <span
            style={{
              color: isDark ? "rgba(255,255,255,0.92)" : "rgba(22,90,139,0.85)",
              fontSize: "0.65rem",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            scroll
          </span>
          <motion.div
            className="flex flex-col items-center"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {[0, 1].map((i) => (
              <svg
                key={i}
                width="22"
                height="14"
                viewBox="0 0 24 14"
                fill="none"
                style={{
                  stroke: isDark
                    ? `rgba(255,255,255,${i === 0 ? 0.7 : 0.3})`
                    : `rgba(22,90,139,${i === 0 ? 0.7 : 0.35})`,
                  strokeWidth: 2,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  marginTop: i === 1 ? "-4px" : undefined,
                }}
              >
                <polyline points="3 3 12 11 21 3" />
              </svg>
            ))}
          </motion.div>
        </motion.div>

        {/* Resume modal */}
        {resumeOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setResumeOpen(false)}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            />
            <div
              className={`relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-3xl ${glassBoxClassNames}`}
              style={{
                ...glassStyle,
                backgroundColor: isDark
                  ? "rgba(14,16,20,0.72)"
                  : "rgba(255,255,255,0.55)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <GlassLayers />
              <div className="sticky top-0 z-10 flex justify-between items-center p-4">
                <a
                  href="/Kanaskie_Henry_Resume.pdf"
                  download
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-opacity hover:opacity-70 ${glassBoxClassNames}`}
                  style={{
                    ...glassStyle,
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                  }}
                >
                  <span
                    className="flex items-center gap-2 bg-clip-text text-transparent"
                    style={{
                      WebkitBackgroundClip: "text",
                      backgroundImage: themed(
                        isDark,
                        cs.liquidGlass.dark,
                        cs.liquidGlass.light,
                      ),
                      fontSize: "0.9rem",
                      fontWeight: 600,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={themed(isDark, cs.color.dark, cs.color.light)}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PDF
                  </span>
                </a>
                <button
                  onClick={() => setResumeOpen(false)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-opacity hover:opacity-70 cursor-pointer ${glassBoxClassNames}`}
                  style={{
                    ...glassStyle,
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                    color: isDark
                      ? "rgba(255,255,255,0.6)"
                      : "rgba(20,28,48,0.5)",
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="p-6 pt-0 relative z-[1]">
                <div
                  className="w-full rounded-lg"
                  style={{
                    height: "80vh",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <iframe
                    src="/Kanaskie_Henry_Resume.pdf#toolbar=0&navpanes=0"
                    style={{
                      border: "none",
                      outline: "none",
                      position: "absolute",
                      top: "-4px",
                      left: "-4px",
                      width: "calc(100% + 8px)",
                      height: "calc(100% + 8px)",
                      colorScheme: "light",
                    }}
                    title="Resume"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email modal */}
        {emailOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setEmailOpen(false)}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            />
            <div
              className={`relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-3xl ${glassBoxClassNames}`}
              style={{
                ...glassStyle,
                backgroundColor: isDark
                  ? "rgba(14,16,20,0.72)"
                  : "rgba(255,255,255,0.55)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <GlassLayers />
              <div className="relative z-[1] flex justify-between items-center p-6 pb-0">
                <FuzzyText>
                  <span
                    style={{
                      color: isDark
                        ? "rgba(255,255,255,0.88)"
                        : "rgba(20,28,48,0.82)",
                      fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)",
                      fontWeight: 700,
                    }}
                  >
                    Send a Message
                  </span>
                </FuzzyText>
                <button
                  onClick={() => setEmailOpen(false)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-opacity hover:opacity-70 cursor-pointer ${glassBoxClassNames}`}
                  style={{
                    ...glassStyle,
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                    color: isDark
                      ? "rgba(255,255,255,0.6)"
                      : "rgba(20,28,48,0.5)",
                  }}
                >
                  ✕
                </button>
              </div>
              <form
                onSubmit={handleEmailSubmit}
                noValidate
                className="relative z-[1] p-6 flex flex-col gap-4"
              >
                {/* Honeypot: visually hidden, bots fill it, humans never see it */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  aria-hidden="true"
                  autoComplete="off"
                  style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
                />
                {(["name", "email", "subject"] as const).map((field) => (
                  <div key={field}>
                    <FuzzyText>
                      <label
                        className="block mb-1.5"
                        style={{
                          color: isDark
                            ? "rgba(255,255,255,0.5)"
                            : "rgba(20,28,48,0.5)",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {field}
                      </label>
                    </FuzzyText>
                    <input
                      type={field === "email" ? "email" : "text"}
                      value={emailForm[field]}
                      onChange={(e) => {
                        setEmailForm((f) => ({
                          ...f,
                          [field]: e.target.value,
                        }));
                        if (fieldErrors[field])
                          setFieldErrors((fe) => {
                            const n = { ...fe };
                            delete n[field];
                            return n;
                          });
                      }}
                      onFocus={() => setFocusedField(field)}
                      onBlur={() => setFocusedField(null)}
                      className={`w-full rounded-xl px-4 py-2.5 outline-none transition-colors ${glassBoxClassNames}`}
                      style={{
                        ...glassStyle,
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(0,0,0,0.02)",
                        color: isDark
                          ? "rgba(255,255,255,0.88)"
                          : "rgba(20,28,48,0.75)",
                        fontSize: "0.95rem",
                        border: fieldErrors[field]
                          ? `1px solid ${isDark ? "rgba(255,130,130,0.4)" : "rgba(200,60,60,0.3)"}`
                          : focusedField === field
                            ? `1px solid ${isDark ? "rgba(255,255,255,0.3)" : "rgba(20,28,48,0.25)"}`
                            : undefined,
                      }}
                    />
                    {fieldErrors[field] && (
                      <p
                        className="bg-clip-text text-transparent"
                        style={{
                          WebkitBackgroundClip: "text",
                          backgroundImage: isDark
                            ? "linear-gradient(135deg, rgb(255,150,150), rgb(255,130,160))"
                            : "linear-gradient(135deg, rgb(190,60,60), rgb(170,50,80))",
                          fontSize: "0.72rem",
                          fontWeight: 500,
                          marginTop: 4,
                          marginBottom: 0,
                        }}
                      >
                        {fieldErrors[field]}
                      </p>
                    )}
                  </div>
                ))}
                <div>
                  <FuzzyText>
                    <label
                      className="block mb-1.5"
                      style={{
                        color: isDark
                          ? "rgba(255,255,255,0.5)"
                          : "rgba(20,28,48,0.5)",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      Message
                    </label>
                  </FuzzyText>
                  <textarea
                    rows={5}
                    value={emailForm.message}
                    onChange={(e) => {
                      setEmailForm((f) => ({
                        ...f,
                        message: e.target.value,
                      }));
                      if (fieldErrors.message)
                        setFieldErrors((fe) => {
                          const n = { ...fe };
                          delete n.message;
                          return n;
                        });
                    }}
                    onFocus={() => setFocusedField("message")}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full rounded-xl px-4 py-2.5 outline-none transition-colors resize-none ${glassBoxClassNames}`}
                    style={{
                      ...glassStyle,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.02)",
                      color: isDark
                        ? "rgba(255,255,255,0.88)"
                        : "rgba(20,28,48,0.75)",
                      fontSize: "0.95rem",
                      border: fieldErrors.message
                        ? `1px solid ${isDark ? "rgba(255,130,130,0.4)" : "rgba(200,60,60,0.3)"}`
                        : focusedField === "message"
                          ? `1px solid ${isDark ? "rgba(255,255,255,0.3)" : "rgba(20,28,48,0.25)"}`
                          : undefined,
                    }}
                  />
                  {fieldErrors.message && (
                    <p
                      className="bg-clip-text text-transparent"
                      style={{
                        WebkitBackgroundClip: "text",
                        backgroundImage: isDark
                          ? "linear-gradient(135deg, rgb(255,150,150), rgb(255,130,160))"
                          : "linear-gradient(135deg, rgb(190,60,60), rgb(170,50,80))",
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        marginTop: 4,
                        marginBottom: 0,
                      }}
                    >
                      {fieldErrors.message}
                    </p>
                  )}
                </div>
                {emailStatus === "error" && (
                  <p style={{ color: "rgb(255,120,120)", fontSize: "0.85rem" }}>
                    {emailError}
                  </p>
                )}
                {emailStatus === "sent" ? (
                  <FuzzyText>
                    <p
                      className="text-center py-2 bg-clip-text text-transparent"
                      style={{
                        WebkitBackgroundClip: "text",
                        backgroundImage: isDark
                          ? "linear-gradient(135deg, rgb(160,230,190), rgb(180,210,200))"
                          : "linear-gradient(135deg, rgb(60,130,80), rgb(80,140,100))",
                        fontSize: "0.95rem",
                        fontWeight: 600,
                      }}
                    >
                      Message sent successfully!
                    </p>
                  </FuzzyText>
                ) : (
                  <button
                    type="submit"
                    disabled={emailStatus === "sending"}
                    className={`mt-2 w-full py-3 rounded-xl transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${glassBoxClassNames}`}
                    style={{
                      ...glassStyle,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.07)"
                        : "rgba(0,0,0,0.05)",
                    }}
                  >
                    <span
                      style={{
                        color: isDark
                          ? "rgba(255,255,255,0.88)"
                          : "rgba(20,28,48,0.8)",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                      }}
                    >
                      {emailStatus === "sending" ? "Sending..." : "Send"}
                    </span>
                  </button>
                )}
              </form>
            </div>
          </div>
        )}
      </section>

      <SectionDivider />

      {/* ── Experience ─────────────────────────────────────────────────── */}
      <section
        id="experience"
        style={{ scrollMarginTop: "80px" }}
        className="flex flex-col gap-12 md:gap-28 pb-[10vh]"
      >
        <GlassTitle
          text="Experience"
          svgPathsLeft={rocketPaths}
          svgPathsRight={cpuPaths}
          svgRotateLeft={5}
          svgRotateRight={10}
          svgOffsetLeft={{ x: 40, y: 35 }}
          svgOffsetRight={{ x: 10, y: 10 }}
          svgSizeRight={47}
        />
        <InfoBox side="left"
          title="Software Engineering Intern"
          company="DZYNE Technologies"
          role="Embedded Systems & Full-Stack"
          description={[
            "DZYNE builds defense systems at the intersection of autonomy and embedded hardware. I joined a small engineering team working on anti-drone software.",
            "Refactored C and C++ modules to be more modular and maintainable.",
            "Rebuilt the Python test infrastructure to improve reliability and speed.",
            "Designed and shipped an internal full-stack GUI giving operators real-time control over the entire test workflow.",
          ]}
          svgPaths={dronesPaths}
          svgSize={60}
          svgDrawDuration={3}
          extraInfo={{
            startDate: "Mar 2025",
            endDate: "Sep 2025",
            techStack: "Python, C, C++, SQL, React",
            location: "Portland, OR",
            industry: "Defense Technology",
          }}
        />
        <InfoBox side="right"
          title="Applied Machine Learning Researcher"
          company="Plasma, Energy, and Space Propulsion Laboratory"
          role="Signal Processing & ML"
          description="The PESP Lab applies plasma physics to problems in aerospace propulsion and cancer treatment. My work sat at the intersection of ML and signal processing. I spent time making clean diagnostic signals out of high-noise environments and building predictive models from large experimental datasets. The research mission is to make plasma systems more efficient and to make them more precisely controlled. I contributed to that across both the thruster and biomedical sides of the lab."
          svgPaths={thrusterPaths}
          svgDrawDuration={6}
          svgSize={75}
          svgRotate={45}
          svgOffset={{ x: -5, y: 50 }}
          extraInfo={{
            startDate: "May 2024",
            endDate: "Jun 2026",
            techStack: "MATLAB, Python, OR-tools",
            location: "Corvallis, OR",
            industry: "Aerospace Research",
          }}
        />
        <InfoBox side="left"
          title="Undergraduate Researcher"
          company="Jason Clark Research Group"
          role="FPGA & DSP Engineering"
          description={[
            "The Jason Clark Research Group pushes the limits of precision sensing at the micro and nano scale. I worked on the hardware side. I spent my time designing VHDL modules for FPGA-based signal processing so the lab could acquire and characterize nano-ampere signals that were previously impossible to measure. From writing testbenches to integrating damping algorithms via Hardware-in-the-Loop, the work was about giving researchers reliable, stable data they could actually trust.",
          ]}
          svgPaths={fpgaPaths}
          svgSize={65}
          svgOffset={{ x: -45, y: 10 }}
          svgDrawDuration={4}
          extraInfo={{
            startDate: "Feb 2024",
            endDate: "Mar 2025",
            techStack: "VHDL, FPGA, Moku",
            location: "Corvallis, OR",
            industry: "Electrical Engineering Research",
          }}
        />
      </section>

      <SectionDivider />

      {/* ── Projects ───────────────────────────────────────────────────── */}
      <section
          id="projects"
          style={{ scrollMarginTop: "80px" }}
          className="flex flex-col gap-12 md:gap-20 pb-[10vh]"
        >
          <GlassTitle text="Projects" />
          <div className="flex flex-col items-center gap-14 md:gap-24 px-4 md:px-[5%]">
            {rows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="flex flex-col items-center gap-14 md:flex-row md:justify-center md:gap-16 w-full"
              >
                {row.map((project, colIdx) => (
                  <ProjectCard
                    key={project.title}
                    title={project.title}
                    techStack={project.techStack}
                    description={project.description}
                    deployment={project.deployment}
                    bubbleSide={colIdx < row.length / 2 ? "left" : "right"}
                    numCardsInRow={row.length}
                    svgs={project.svgs}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>

      <SectionDivider />

      {/* ── Education ──────────────────────────────────────────────────── */}
      <section
        id="education"
        style={{ scrollMarginTop: "80px" }}
        className="flex flex-col gap-12 md:gap-28 pb-[10vh]"
      >
        <GlassTitle text="Education" />
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
      </section>

      <div style={{ height: 100 }} />
    </div>
  );
}
