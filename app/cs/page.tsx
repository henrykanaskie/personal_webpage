"use client";

import { useEffect, useRef, useState, Fragment } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import GlassTitle from "@/components/GlassTitle";
import {
  GlassLayers,
  glassStyle,
  FuzzyText,
  useIsDark,
  useIsMobile,
} from "@/lib/glass";
import { cs, themed, glassBoxClassNames } from "@/lib/tokens";
import LeftInfoBox from "@/components/LeftInfoBox";
import RightInfoBox from "@/components/RightInfoBox";
import ProjectCard, { ProjectCardProvider } from "@/components/ProjectCard";
import EducationCard from "@/components/EducationCard";
import { rocketPaths } from "@/svgs/rocketPaths";
import { fpgaPaths } from "@/svgs/fpgaPaths";
import { dronesPaths } from "@/svgs/dronesPaths";
import { thrusterPaths } from "@/svgs/thrusterPaths";
import { cpuPaths } from "@/svgs/cpuPaths";
import { beePaths } from "@/svgs/beePaths";
import { nnPaths } from "@/svgs/nnPaths";

// ── GlassBlurb (local component from About section) ──────────────────────────
function GlassBlurb({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const isDark = useIsDark();
  return (
    <div
      style={{ position: "relative", width: "100%" }}
      className="px-2 md:px-4 w-full h-full"
    >
      <div
        style={{ position: "relative", borderRadius: "24px", ...glassStyle }}
        className={`${glassBoxClassNames} p-5 md:p-10 lg:p-12 h-full`}
      >
        <GlassLayers />
        {/* Keep content above any backdrop-filter layers to avoid blur. */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {title && (
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <FuzzyText>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: "text",
                    backgroundImage: themed(
                      isDark,
                      cs.iridescent.dark,
                      cs.iridescent.light,
                    ),
                    fontSize: "clamp(1.1rem, 1.8vw, 1.5rem)",
                    fontWeight: 700,
                  }}
                >
                  {title}
                </span>
              </FuzzyText>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

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
            : "linear-gradient(90deg, transparent, rgba(100,115,145,0.1) 30%, rgba(125,110,135,0.15) 50%, rgba(100,115,145,0.1) 70%, transparent)",
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
  const isMobile = useIsMobile(1000);

  // Active section for nav dots
  const [activeSection, setActiveSection] = useState("about");
  const [hasScrolled, setHasScrolled] = useState(false);
  useEffect(() => {
    const sectionIds = ["about", "experience", "projects", "education"];
    let rafId: number | null = null;
    const handleScroll = () => {
      if (window.scrollY > 80) setHasScrolled(true);
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        let current = sectionIds[0];
        for (const id of sectionIds) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= 120) current = id;
        }
        setActiveSection(current);
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // About section viewport refs for fade-in/out animations
  const contactRef = useRef<HTMLDivElement>(null);
  const contactInView = useInView(contactRef, {
    once: false,
    amount: isMobile ? 0.15 : 0.15,
  });

  // About section modal state
  const [resumeOpen, setResumeOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [emailError, setEmailError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        body: JSON.stringify(emailForm),
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
                  cs.iridescentVertical.dark,
                  cs.iridescentVertical.light,
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

        {/* Dots */}
        {(["about", "experience", "projects", "education"] as const).map(
          (id, i) => {
            const isActive = activeSection === id;
            return (
              <div
                key={id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {i > 0 && (
                  <div
                    style={{
                      width: 1,
                      height: 14,
                      background: isDark
                        ? "rgba(180,200,255,0.1)"
                        : "rgba(100,115,145,0.1)",
                    }}
                  />
                )}
                <button
                  onClick={() =>
                    document
                      .getElementById(id)
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  style={{
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
              </div>
            );
          },
        )}
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
          initial={{ x: "-70vw" }}
          animate={
            contactInView
              ? { x: 0, y: 0 }
              : isMobile
                ? { x: 0, y: 15 }
                : { x: -20, y: 10 }
          }
          exit={{
            x: "-70vw",
            transition: { duration: 0.55, ease: [0.5, 0, 0.75, 0] },
          }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="w-full px-2 md:px-[5%]"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={contactInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            className="flex flex-col md:flex-row items-center gap-6 md:gap-10 pt-8 md:pt-14"
          >
            {/* Row 1 on mobile: Photo + Name/Links side by side */}
            <div className="flex flex-row items-center gap-6 w-full md:contents">
              {/* Photo */}
              <div
                style={{
                  flexShrink: 0,
                  width: isMobile
                    ? "min(180px, 42vw)"
                    : "clamp(150px, 22vw, 320px)",
                  aspectRatio: "3/4",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
                  boxShadow: isDark
                    ? "0 4px 32px rgba(0,0,0,0.55)"
                    : "0 2px 16px rgba(0,0,0,0.12)",
                }}
              >
                <img
                  src="/photography/cs_profile/IMG_4059.jpeg"
                  alt="Henry Kanaskie"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              {/* Name + Links */}
              <div
                className={`flex flex-col ${isMobile ? "items-start" : "shrink-0"}`}
                style={{ gap: "0.05em" }}
              >
                <GlassTitle
                  text={"Henry\nKanaskie"}
                  variant="crystalline"
                  containerClassName="justify-start items-start pt-0 pb-0"
                  fontSize={
                    isMobile
                      ? "clamp(2rem, 10vw, 3.5rem)"
                      : "clamp(2.8rem, 7vw, 7rem)"
                  }
                />
                <div
                  className={`flex flex-wrap ${isMobile ? "justify-center" : ""} items-center gap-4 mt-3`}
                >
                  {[
                    {
                      label: "Email",
                      href: undefined,
                      action: () => {
                        setEmailOpen(true);
                        setEmailStatus("idle");
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
                  ].map((item, i, arr) => {
                    const inner = (
                      <span
                        style={{
                          color: "rgba(255, 255, 255, 0.92)",
                          fontSize: "clamp(0.9rem, 1.3vw, 1.2rem)",
                          fontWeight: 600,
                        }}
                      >
                        {item.label}
                      </span>
                    );
                    return (
                      <Fragment key={item.label}>
                        {item.href ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:opacity-70 transition-opacity"
                          >
                            {inner}
                          </a>
                        ) : (
                          <button
                            onClick={item.action}
                            className="hover:opacity-70 transition-opacity cursor-pointer"
                          >
                            {inner}
                          </button>
                        )}
                        {i < arr.length - 1 && (
                          <span
                            style={{
                              width: 1,
                              height: "1em",
                              display: "inline-block",
                              background: isDark
                                ? "linear-gradient(180deg, transparent, rgba(180,200,255,0.3), transparent)"
                                : "linear-gradient(180deg, transparent, rgba(100,115,145,0.25), transparent)",
                            }}
                          />
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* end mobile row 1 */}

            {/* Bio */}
            <div className="flex-1 min-w-0 w-full">
              <GlassBlurb>
                <FuzzyText>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.92)",
                      fontSize: "clamp(0.85rem, 1.2vw, 1.05rem)",
                      fontWeight: 500,
                      lineHeight: 1.8,
                    }}
                  >
                    Hey there! I&apos;m a Computer Science honors student at
                    Oregon State University, passionate about machine learning,
                    space, and medicine. From optimizing anti-drone software at
                    DZYNE Technologies to engineering plasma thruster
                    diagnostics and FPGA pipelines in research labs, I love
                    working on software and impactful technology that helps
                    people. I&apos;m driven by problems where computation meets
                    real-world change and improvement. Outside of engineering,
                    I&apos;m usually behind a camera, on the slopes, lifting, or
                    hunting for new music. I value growth and learning above
                    everything, and I&apos;m always excited to connect with
                    others who share that mindset!
                  </p>
                </FuzzyText>
              </GlassBlurb>
            </div>
          </motion.div>
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
              color: "rgba(255, 255, 255, 0.92)",
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
                  stroke: `rgba(255,255,255,${i === 0 ? 0.7 : 0.3})`,
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
                  ? "rgba(20,20,40,0.65)"
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
                      ? "rgba(180,200,255,0.08)"
                      : "rgba(100,115,145,0.06)",
                  }}
                >
                  <span
                    className="flex items-center gap-2 bg-clip-text text-transparent"
                    style={{
                      WebkitBackgroundClip: "text",
                      backgroundImage: themed(
                        isDark,
                        cs.iridescentShort.dark,
                        cs.iridescentShort.light,
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
                      ? "rgba(180,200,255,0.08)"
                      : "rgba(100,115,145,0.06)",
                    color: themed(isDark, cs.color.dark, cs.color.light),
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
                  ? "rgba(20,20,40,0.65)"
                  : "rgba(255,255,255,0.55)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <GlassLayers />
              <div className="relative z-[1] flex justify-between items-center p-6 pb-0">
                <FuzzyText>
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      WebkitBackgroundClip: "text",
                      backgroundImage: themed(
                        isDark,
                        cs.iridescent.dark,
                        cs.iridescent.light,
                      ),
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
                      ? "rgba(180,200,255,0.08)"
                      : "rgba(100,115,145,0.06)",
                    color: themed(isDark, cs.color.dark, cs.color.light),
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
                {(["name", "email", "subject"] as const).map((field) => (
                  <div key={field}>
                    <FuzzyText>
                      <label
                        className="block mb-1.5 bg-clip-text text-transparent"
                        style={{
                          WebkitBackgroundClip: "text",
                          backgroundImage: themed(
                            isDark,
                            cs.iridescentShort.dark,
                            cs.iridescentShort.light,
                          ),
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
                      className={`w-full rounded-xl px-4 py-2.5 outline-none transition-colors ${glassBoxClassNames}`}
                      style={{
                        ...glassStyle,
                        backgroundColor: isDark
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(0,0,0,0.02)",
                        color: isDark ? "rgb(200,215,255)" : "rgb(80,95,125)",
                        fontSize: "0.95rem",
                        border: fieldErrors[field]
                          ? `1px solid ${
                              isDark
                                ? "rgba(255,130,130,0.4)"
                                : "rgba(200,60,60,0.3)"
                            }`
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
                      className="block mb-1.5 bg-clip-text text-transparent"
                      style={{
                        WebkitBackgroundClip: "text",
                        backgroundImage: themed(
                          isDark,
                          cs.iridescentShort.dark,
                          cs.iridescentShort.light,
                        ),
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
                    className={`w-full rounded-xl px-4 py-2.5 outline-none transition-colors resize-none ${glassBoxClassNames}`}
                    style={{
                      ...glassStyle,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.02)",
                      color: isDark ? "rgb(200,215,255)" : "rgb(80,95,125)",
                      fontSize: "0.95rem",
                      border: fieldErrors.message
                        ? `1px solid ${
                            isDark
                              ? "rgba(255,130,130,0.4)"
                              : "rgba(200,60,60,0.3)"
                          }`
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
                        ? "rgba(180,200,255,0.1)"
                        : "rgba(100,115,145,0.08)",
                    }}
                  >
                    <span
                      className="bg-clip-text text-transparent"
                      style={{
                        WebkitBackgroundClip: "text",
                        backgroundImage: themed(
                          isDark,
                          cs.iridescentMedium.dark,
                          cs.iridescentMedium.light,
                        ),
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
        <LeftInfoBox
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
        <RightInfoBox
          title="Undergraduate Researcher"
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
        <LeftInfoBox
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
      <ProjectCardProvider>
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
                    svgs={project.svgs}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>
      </ProjectCardProvider>

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
