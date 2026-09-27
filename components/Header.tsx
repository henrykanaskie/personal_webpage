"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { PhotographyFilmStripNav } from "./PhotographyFilmStripNav";
import FeedbackToggle from "./photo/FeedbackToggle";
import { glassStyle } from "../lib/glass";
import { runThemeTransition } from "../lib/themeTransition";
import { glassBubbleClassNames, metalClassNames, cs, photo } from "../lib/tokens";

// ─── Navigation links ─────────────────────────────────────────────────────────

const csNavLinks = [
  { name: "About", href: "/cs", sectionId: "about" },
  { name: "Experience", href: "/cs", sectionId: "experience" },
  { name: "Projects", href: "/cs", sectionId: "projects" },
  { name: "Education", href: "/cs", sectionId: "education" },
  { name: "Resume", href: "/resume", sectionId: null },
];

// ─── Crystalline text (CS nav) ────────────────────────────────────────────────

export function CrystallineText({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
  isDark?: boolean;
}) {
  // Nav and pill labels: plain ink. The active item sits on chrome, which
  // carries its own ink colour, so it only needs to inherit.
  return (
    <span
      className="relative inline-block"
      style={{ color: active ? "inherit" : undefined, letterSpacing: "-0.01em" }}
    >
      {children}
    </span>
  );
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────

// Photography palette for toggle
const photoToggleLight = photo.toggle.light;
const photoToggleDark = photo.toggle.dark;

// CS palette for toggle (matches IridescentText / glass nav)
const csToggleLight = cs.toggle.light;
const csToggleDark = cs.toggle.dark;

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
  onToggle: (e: React.MouseEvent<HTMLElement>) => void;
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
            ? photo.toggleHover.dark
            : photo.toggleHover.light;
        } else {
          e.currentTarget.style.background = isDark
            ? cs.toggleHover.dark
            : cs.toggleHover.light;
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

  // Hide nav links when a CS modal (resume / email) is open
  const [csModalOpen, setCsModalOpen] = useState(false);
  useEffect(() => {
    const onCsModal = (e: Event) => {
      setCsModalOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    };
    window.addEventListener("csModal", onCsModal);
    return () => window.removeEventListener("csModal", onCsModal);
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

  // The switch itself happens under the halftone curtain (lib/themeTransition),
  // which starts from the toggle that was pressed.
  const toggleDarkMode = (e?: React.MouseEvent<HTMLElement>) => {
    const newDark = !isDark;
    const r = e?.currentTarget.getBoundingClientRect();
    runThemeTransition({
      x: r ? r.left + r.width / 2 : window.innerWidth - 44,
      y: r ? r.top + r.height / 2 : 44,
      toDark: newDark,
      photoSide: !!isPhotoSide,
      apply: () => {
        setIsDark(newDark);
        document.documentElement.classList.toggle("dark", newDark);
      },
    });
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
          {/* Reuse the CS home icon: it matches the split motif */}
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
              fill="currentColor"
              opacity={0.9}
            />
            <rect
              x="11"
              y="3"
              width="7"
              height="14"
              rx="1.5"
              fill="currentColor"
              opacity={0.55}
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
          <>
            <FeedbackToggle isDark={isDark} />
            <ThemeToggleButton
              isDark={isDark}
              mounted={mounted}
              maskId={maskId}
              onToggle={toggleDarkMode}
              photoMode
            />
          </>
        }
      />
    );
  }

  // ── CS side: individual glass bubble nav ──
  const homeSvg = (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="7" height="14" rx="1.5"
        fill="currentColor" opacity={0.85} />
      <rect x="11" y="3" width="7" height="14" rx="1.5"
        fill="currentColor" opacity={0.55} />
    </svg>
  );

  const header = (
    <header
      ref={navRef}
      className="sticky top-2 mx-2 mt-2 p-3 hidden md:block"
      style={{ zIndex: 9999 }}
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

        {/* ── Desktop nav bubbles: evenly spaced ── */}
        <div
          className="hidden md:flex flex-1 items-center justify-evenly"
          style={{
            opacity: visible && !csModalOpen ? 1 : 0,
            transform: visible && !csModalOpen ? "translateY(0)" : "translateY(-8px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
            pointerEvents: visible && !csModalOpen ? "auto" : "none",
          }}
        >
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
                className={`${metalClassNames}${active ? " is-current" : ""} px-7 py-3 rounded-full font-semibold text-lg transition-all duration-200`}
                aria-current={active ? "page" : undefined}
                style={glassStyle}
              >
                <CrystallineText active={active} isDark={isDark}>
                  {link.name}
                </CrystallineText>
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
