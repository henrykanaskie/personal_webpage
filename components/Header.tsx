"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PhotographyFilmStripNav } from "./PhotographyFilmStripNav";
import { glassStyle, glassBubbleClassNames } from "./InfoBubble";

// ─── Navigation links ─────────────────────────────────────────────────────────

const csNavLinks = [
  { name: "About", href: "/cs", sectionId: "about" },
  { name: "Experience", href: "/cs", sectionId: "experience" },
  { name: "Projects", href: "/cs", sectionId: "projects" },
  { name: "Education", href: "/cs", sectionId: "education" },
  { name: "Resume", href: "/resume", sectionId: null },
];

// ─── CS Gradients (cool iridescent) ──────────────────────────────────────────

const csLightGrad = `linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)`;
const csDarkGrad = `linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)`;

const csLightGradActive = `linear-gradient(135deg, rgb(70,85,115) 0%, rgb(95,80,105) 15%, rgb(75,100,120) 30%, rgb(100,85,100) 45%, rgb(70,95,115) 60%, rgb(90,80,110) 75%, rgb(75,90,118) 90%, rgb(98,85,105) 100%)`;
const csDarkGradActive = `linear-gradient(135deg, rgb(220,235,255) 0%, rgb(245,230,250) 15%, rgb(220,245,255) 30%, rgb(250,235,245) 45%, rgb(215,240,255) 60%, rgb(240,230,250) 75%, rgb(220,238,255) 90%, rgb(245,230,248) 100%)`;

// ─── Iridescent text (CS nav) ──────────────────────────────────────────────────

function IridescentText({
  children,
  active = false,
  isDark = false,
  gradientOverride,
  activeGradientOverride,
}: {
  children: React.ReactNode;
  active?: boolean;
  isDark?: boolean;
  gradientOverride?: string;
  activeGradientOverride?: string;
}) {
  const baseGrad = isDark ? csDarkGrad : csLightGrad;
  const activeGrad = isDark ? csDarkGradActive : csLightGradActive;

  const gradient = active
    ? (activeGradientOverride ?? activeGrad)
    : (gradientOverride ?? baseGrad);

  return (
    <span
      className="bg-clip-text text-transparent"
      style={{ WebkitBackgroundClip: "text", backgroundImage: gradient }}
    >
      {children}
    </span>
  );
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────

// Photography palette for toggle
const photoToggleLight = "rgb(100, 80, 115)";
const photoToggleDark = "rgb(218, 198, 228)";

// CS palette for toggle (matches IridescentText / glass nav)
const csToggleLight = "rgb(100, 115, 145)";
const csToggleDark = "rgb(195, 210, 240)";

function ThemeToggleButton({
  isDark,
  mounted,
  maskId,
  onToggle,
  photoMode = false,
}: {
  isDark: boolean;
  mounted: boolean;
  maskId: string;
  onToggle: () => void;
  photoMode?: boolean;
}) {
  if (!mounted) return null;

  const buttonStyle = photoMode
    ? {
        background: "transparent",
        color: isDark ? photoToggleDark : photoToggleLight,
      }
    : {
        background: "transparent",
        color: isDark ? csToggleDark : csToggleLight,
      };

  return (
    <button
      onClick={onToggle}
      className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300"
      style={buttonStyle}
      aria-label="Toggle dark mode"
      onMouseEnter={(e) => {
        if (photoMode) {
          e.currentTarget.style.background = isDark
            ? "rgba(195,175,225,0.06)"
            : "rgba(128,72,138,0.06)";
        } else {
          e.currentTarget.style.background = isDark
            ? "rgba(180,200,255,0.08)"
            : "rgba(100,115,145,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        style={{ overflow: "visible", color: "inherit" }}
        animate={{ rotate: isDark ? 0 : 40 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="24" height="24" fill="white" />
            <motion.circle
              fill="black"
              r="8"
              initial={false}
              animate={{ cx: isDark ? 32 : 18, cy: isDark ? -2 : 5 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </mask>
          {isDark && (
            <linearGradient id={`${maskId}-grad`} x1="0" y1="0" x2="1" y2="1">
              {photoMode ? (
                <>
                  <stop offset="0%" stopColor="rgb(218, 198, 228)" />
                  <stop offset="50%" stopColor="rgb(210, 188, 222)" />
                  <stop offset="100%" stopColor="rgb(218, 198, 228)" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="rgba(220,225,255,0.95)" />
                  <stop offset="25%" stopColor="rgba(245,220,250,0.9)" />
                  <stop offset="50%" stopColor="rgba(220,240,255,0.95)" />
                  <stop offset="75%" stopColor="rgba(250,225,245,0.9)" />
                  <stop offset="100%" stopColor="rgba(225,230,255,0.95)" />
                </>
              )}
            </linearGradient>
          )}
        </defs>
        <motion.circle
          cx="12"
          cy="12"
          fill={
            isDark
              ? `url(#${maskId}-grad)`
              : photoMode
                ? photoToggleLight
                : csToggleLight
          }
          mask={`url(#${maskId})`}
          initial={false}
          animate={{ r: isDark ? 5 : 9 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        <motion.g
          stroke={
            isDark
              ? photoMode
                ? photoToggleDark
                : csToggleDark
              : photoMode
                ? photoToggleLight
                : csToggleLight
          }
          strokeWidth="2"
          strokeLinecap="round"
          initial={false}
          animate={{ opacity: isDark ? 1 : 0, scale: isDark ? 1 : 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ transformOrigin: "12px 12px" }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 12 + 8 * Math.cos(rad);
            const y1 = 12 + 8 * Math.sin(rad);
            const x2 = 12 + 10.5 * Math.cos(rad);
            const y2 = 12 + 10.5 * Math.sin(rad);
            return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </motion.g>
      </motion.svg>
    </button>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export default function Header() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const navRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const maskId = useId();
  const maskIdMobile = useId();

  const isHome = pathname === "/";
  const isPhotoSide = pathname?.startsWith("/photography");
  const isCSPage = pathname === "/cs";

  // Track which section is in view when on the single-page CS view
  const [activeSection, setActiveSection] = useState<string | null>(null);


  // Track active section by scroll position when on the single-page CS view
  useEffect(() => {
    if (!isCSPage) {
      setActiveSection(null);
      return;
    }
    const sectionIds = ["about", "experience", "projects", "education"];
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        let current = sectionIds[0];
        for (const id of sectionIds) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= 100) {
            current = id;
          }
        }
        setActiveSection(current);
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isCSPage]);

  // Hide nav when a photo lightbox is open
  useEffect(() => {
    const onLightbox = (e: Event) => {
      const open = (e as CustomEvent<{ open: boolean }>).detail.open;
      setVisible(!open);
    };
    window.addEventListener("photoLightbox", onLightbox);
    return () => window.removeEventListener("photoLightbox", onLightbox);
  }, []);

  // Smart navbar: show on scroll up, hide on scroll down
  useEffect(() => {
    const onScroll = () => {
      // Ignore scroll events while body is frozen during page transitions
      if (document.body.style.position === "fixed") return;
      const currentY = window.scrollY;
      if (currentY < 50) {
        setVisible(true);
      } else if (currentY < lastScrollY.current) {
        setVisible(true);
      } else if (currentY > lastScrollY.current + 5) {
        setVisible(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);
    if (mediaQuery.matches) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      document.documentElement.classList.toggle("dark", e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
  };

  // On the home split-screen page the header is invisible, but we keep a
  // same-height placeholder in the DOM so CS pages don't shift during exit.
  if (isHome) {
    return (
      <header
        className="sticky top-2 z-50 mx-2 mt-2 p-3"
        aria-hidden="true"
        style={{ visibility: "hidden", pointerEvents: "none" }}
      >
        <nav className="h-12" />
      </header>
    );
  }

  const mobileControls = (
    <div
      className="md:hidden fixed top-3 left-3 right-3"
      style={{
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <div className="flex items-center justify-between">
        <Link
          href="/"
          scroll={false}
          aria-label="Return to split view"
          title="Return to split view"
          className={`${glassBubbleClassNames} flex items-center justify-center w-12 h-12 rounded-full shrink-0`}
          style={{ ...glassStyle, pointerEvents: "auto" }}
        >
          {/* Reuse the CS home icon — it matches the split motif */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="2"
              y="3"
              width="7"
              height="14"
              rx="1.5"
              fill={isDark ? "rgba(220,235,255,0.9)" : "rgba(100,115,145,0.85)"}
              opacity={0.9}
            />
            <rect
              x="11"
              y="3"
              width="7"
              height="14"
              rx="1.5"
              fill={isDark ? "rgba(245,220,250,0.8)" : "rgba(120,95,135,0.8)"}
              opacity={0.9}
            />
          </svg>
        </Link>

        <div
          className={`${glassBubbleClassNames} flex items-center justify-center w-12 h-12 rounded-full shrink-0`}
          style={{ ...glassStyle, pointerEvents: "auto" }}
        >
          <ThemeToggleButton
            isDark={isDark}
            mounted={mounted}
            maskId={maskIdMobile}
            onToggle={toggleDarkMode}
            photoMode={isPhotoSide}
          />
        </div>
      </div>
    </div>
  );

  // ── Photography side: bottom film strip nav ──
  if (isPhotoSide) {
    const photoBorder = isDark
      ? "rgba(200,185,230,0.12)"
      : "rgba(120,85,145,0.1)";
    return (
      <PhotographyFilmStripNav
        isDark={isDark}
        visible={visible}
        pathname={pathname}
        leftControls={
          <Link
            href="/"
            scroll={false}
            title="Home"
            aria-label="Home"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: isDark ? "rgba(20,16,32,0.9)" : "rgba(248,245,240,0.95)",
              border: `1px solid ${photoBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
              <rect
                x="2"
                y="3"
                width="7"
                height="14"
                rx="1.5"
                fill={isDark ? "rgba(200,185,230,0.8)" : "rgba(120,85,145,0.7)"}
              />
              <rect
                x="11"
                y="3"
                width="7"
                height="14"
                rx="1.5"
                fill={
                  isDark ? "rgba(200,185,230,0.5)" : "rgba(120,85,145,0.45)"
                }
              />
            </svg>
          </Link>
        }
        bottomControls={
          <ThemeToggleButton
            isDark={isDark}
            mounted={mounted}
            maskId={maskId}
            onToggle={toggleDarkMode}
            photoMode
          />
        }
      />
    );
  }

  // ── CS side: individual glass bubble nav ──
  const activeBubbleStyle: React.CSSProperties = {
    ...glassStyle,
    border: isDark ? "1px solid rgba(180,200,255,0.3)" : "1px solid rgba(100,115,145,0.25)",
    boxShadow: isDark
      ? "inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(180,200,255,0.1)"
      : "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 16px rgba(100,115,145,0.1)",
  };

  const homeSvg = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="7" height="14" rx="1.5"
        fill={isDark ? "url(#cs-home-grad-dark-l)" : "url(#cs-home-grad-light-l)"} opacity={0.85} />
      <rect x="11" y="3" width="7" height="14" rx="1.5"
        fill={isDark ? "url(#cs-home-grad-dark-r)" : "url(#cs-home-grad-light-r)"} opacity={0.85} />
      <defs>
        <linearGradient id="cs-home-grad-dark-l" x1="2" y1="3" x2="9" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgb(180,200,255)" /><stop offset="1" stopColor="rgb(210,185,230)" />
        </linearGradient>
        <linearGradient id="cs-home-grad-dark-r" x1="11" y1="3" x2="18" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgb(200,185,225)" /><stop offset="1" stopColor="rgb(180,200,255)" />
        </linearGradient>
        <linearGradient id="cs-home-grad-light-l" x1="2" y1="3" x2="9" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgb(100,115,145)" /><stop offset="1" stopColor="rgb(125,110,135)" />
        </linearGradient>
        <linearGradient id="cs-home-grad-light-r" x1="11" y1="3" x2="18" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgb(120,95,135)" /><stop offset="1" stopColor="rgb(100,115,145)" />
        </linearGradient>
      </defs>
    </svg>
  );

  const header = (
    <header
      ref={navRef}
      className="sticky top-2 mx-2 mt-2 p-3 hidden md:block"
      style={{
        zIndex: 9999,
        transform: visible ? "translateY(0)" : "translateY(-120%)",
        transition: "transform 0.35s ease",
      }}
    >
      <nav className="flex items-center gap-2">
        {/* Home bubble */}
        <Link
          href="/"
          scroll={false}
          aria-label="Home"
          title="Home"
          className={`${glassBubbleClassNames} flex items-center justify-center w-12 h-12 rounded-full shrink-0 transition-all duration-200`}
          style={glassStyle}
        >
          {homeSvg}
        </Link>

        {/* ── Desktop nav bubbles — evenly spaced ── */}
        <div className="hidden md:flex flex-1 items-center justify-evenly">
          {csNavLinks.map((link) => {
            const active = link.sectionId
              ? isCSPage && activeSection === link.sectionId
              : pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                scroll={false}
                onClick={(e) => {
                  if (link.sectionId && isCSPage) {
                    e.preventDefault();
                    document
                      .getElementById(link.sectionId)
                      ?.scrollIntoView({ behavior: "smooth" });
                  } else if (link.sectionId) {
                    // Navigating into /cs (e.g. from /resume): remember target section
                    try {
                      sessionStorage.setItem("csScrollTo", link.sectionId);
                    } catch {
                      // ignore (private mode, etc.)
                    }
                  }
                }}
                className={`${glassBubbleClassNames} px-7 py-3 rounded-full font-semibold text-lg transition-all duration-200`}
                style={active ? activeBubbleStyle : glassStyle}
              >
                <IridescentText active={active} isDark={isDark}>
                  {link.name}
                </IridescentText>
              </Link>
            );
          })}
        </div>

        {/* Theme toggle bubble (desktop) */}
        <div
          className={`${glassBubbleClassNames} hidden md:flex items-center justify-center w-12 h-12 rounded-full shrink-0`}
          style={glassStyle}
        >
          <ThemeToggleButton
            isDark={isDark}
            mounted={mounted}
            maskId={maskId}
            onToggle={toggleDarkMode}
          />
        </div>
      </nav>

    </header>
  );

  return (
    <>
      {mobileControls}
      {header}
    </>
  );
}
