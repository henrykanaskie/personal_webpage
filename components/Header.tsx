"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { glassStyle } from "./InfoBubble";
import { glassClassNames } from "./LeftInfoBox";
import { PhotographyFilmStripNav } from "./PhotographyFilmStripNav";

// ─── Navigation links ─────────────────────────────────────────────────────────

const csNavLinks = [
  { name: "About", href: "/about" },
  { name: "Experience", href: "/cs/experience" },
  { name: "Projects", href: "/cs/projects" },
  { name: "Education", href: "/cs/education" },
];

// ─── CS Gradients (cool iridescent) ──────────────────────────────────────────

const csLightGrad = `linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)`;
const csDarkGrad = `linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)`;

const csLightGradActive = `linear-gradient(135deg, rgb(70,85,115) 0%, rgb(95,80,105) 15%, rgb(75,100,120) 30%, rgb(100,85,100) 45%, rgb(70,95,115) 60%, rgb(90,80,110) 75%, rgb(75,90,118) 90%, rgb(98,85,105) 100%)`;
const csDarkGradActive = `linear-gradient(135deg, rgb(220,235,255) 0%, rgb(245,230,250) 15%, rgb(220,245,255) 30%, rgb(250,235,245) 45%, rgb(215,240,255) 60%, rgb(240,230,250) 75%, rgb(220,238,255) 90%, rgb(245,230,248) 100%)`;

const csUnderlineLight = `linear-gradient(90deg, rgb(100,115,145), rgb(125,110,135), rgb(105,130,150), rgb(130,115,130), rgb(100,115,145))`;
const csUnderlineDark = `linear-gradient(90deg, rgb(180,200,255), rgb(210,185,230), rgb(180,210,235), rgb(210,185,230), rgb(180,200,255))`;

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const maskId = useId();
  const maskIdMobile = useId();

  const isHome = pathname === "/";
  const isPhotoSide = pathname?.startsWith("/photography");

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Smart navbar: show on scroll up, hide on scroll down
  useEffect(() => {
    const onScroll = () => {
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

  // Hide entirely on the home split-screen page
  if (isHome) return null;

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
        bottomControls={
          <>
            <ThemeToggleButton
              isDark={isDark}
              mounted={mounted}
              maskId={maskId}
              onToggle={toggleDarkMode}
              photoMode
            />
            <Link
              href="/"
              scroll={false}
              title="Home"
              aria-label="Home"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: isDark
                  ? "rgba(20,16,32,0.9)"
                  : "rgba(248,245,240,0.95)",
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
                  fill={
                    isDark ? "rgba(200,185,230,0.8)" : "rgba(120,85,145,0.7)"
                  }
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
          </>
        }
      />
    );
  }

  // ── CS side: glassmorphic nav ──
  return (
    <header
      className={`${glassClassNames} sticky top-2 z-50 p-4 rounded-2xl overflow-hidden mx-2 mt-2`}
      style={{
        ...glassStyle,
        transform: visible ? "translateY(0)" : "translateY(-120%)",
        transition: "transform 0.35s ease",
      }}
    >
      {/* Specular highlight — top */}
      <div
        className="dark:hidden"
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 70%, transparent)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        className="hidden dark:block"
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 70%, transparent)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Specular highlight — bottom */}
      <div
        className="dark:hidden"
        style={{
          position: "absolute",
          bottom: 0,
          left: "10%",
          right: "10%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.04) 70%, transparent)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        className="hidden dark:block"
        style={{
          position: "absolute",
          bottom: 0,
          left: "10%",
          right: "10%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.2) 70%, transparent)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Chromatic aberration edge glow */}
      <div
        style={{
          position: "absolute",
          inset: -1,
          pointerEvents: "none",
          zIndex: 0,
          boxShadow:
            "inset 2px 0 8px rgba(255,0,80,0.04), inset -2px 0 8px rgba(0,100,255,0.04), inset 0 2px 8px rgba(255,200,0,0.03), inset 0 -2px 8px rgba(0,200,255,0.03)",
        }}
      />

      {/* Internal refraction gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.02) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(200,220,255,0.05) 0%, transparent 50%)",
        }}
      />

      <nav className="container mx-auto flex justify-between items-center relative z-10">
        {/* Home icon — split-screen */}
        <Link
          href="/"
          scroll={false}
          className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:bg-white/5"
          aria-label="Home"
          title="Home"
        >
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
              fill={
                isDark
                  ? "url(#cs-home-grad-dark-l)"
                  : "url(#cs-home-grad-light-l)"
              }
              opacity={0.85}
            />
            <rect
              x="11"
              y="3"
              width="7"
              height="14"
              rx="1.5"
              fill={
                isDark
                  ? "url(#cs-home-grad-dark-r)"
                  : "url(#cs-home-grad-light-r)"
              }
              opacity={0.85}
            />
            <defs>
              <linearGradient
                id="cs-home-grad-dark-l"
                x1="2"
                y1="3"
                x2="9"
                y2="17"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="rgb(180,200,255)" />
                <stop offset="1" stopColor="rgb(210,185,230)" />
              </linearGradient>
              <linearGradient
                id="cs-home-grad-dark-r"
                x1="11"
                y1="3"
                x2="18"
                y2="17"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="rgb(200,185,225)" />
                <stop offset="1" stopColor="rgb(180,200,255)" />
              </linearGradient>
              <linearGradient
                id="cs-home-grad-light-l"
                x1="2"
                y1="3"
                x2="9"
                y2="17"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="rgb(100,115,145)" />
                <stop offset="1" stopColor="rgb(125,110,135)" />
              </linearGradient>
              <linearGradient
                id="cs-home-grad-light-r"
                x1="11"
                y1="3"
                x2="18"
                y2="17"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="rgb(120,95,135)" />
                <stop offset="1" stopColor="rgb(100,115,145)" />
              </linearGradient>
            </defs>
          </svg>
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden md:flex items-center space-x-4">
          <ul className="flex items-center space-x-4 font-semibold text-lg">
            {csNavLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.name}>
                  <Link href={link.href} scroll={false} className="relative">
                    <IridescentText active={active} isDark={isDark}>
                      {link.name}
                    </IridescentText>
                    {active && (
                      <motion.div
                        className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full overflow-hidden"
                        layoutId="underline"
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: isDark
                              ? csUnderlineDark
                              : csUnderlineLight,
                          }}
                        />
                      </motion.div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ThemeToggleButton
            isDark={isDark}
            mounted={mounted}
            maskId={maskId}
            onToggle={toggleDarkMode}
          />
        </div>

        {/* ── Mobile: theme toggle + hamburger ── */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggleButton
            isDark={isDark}
            mounted={mounted}
            maskId={maskIdMobile}
            onToggle={toggleDarkMode}
          />
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-all duration-200"
            aria-label="Toggle menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              className="text-black dark:text-white"
            >
              <motion.line
                x1="3"
                x2="17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                animate={
                  menuOpen
                    ? { y1: 10, y2: 10, rotate: 45 }
                    : { y1: 5, y2: 5, rotate: 0 }
                }
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ transformOrigin: "center" }}
              />
              <motion.line
                x1="3"
                y1="10"
                x2="17"
                y2="10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                animate={{
                  opacity: menuOpen ? 0 : 1,
                  scaleX: menuOpen ? 0 : 1,
                }}
                transition={{ duration: 0.2 }}
                style={{ transformOrigin: "center" }}
              />
              <motion.line
                x1="3"
                x2="17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                animate={
                  menuOpen
                    ? { y1: 10, y2: 10, rotate: -45 }
                    : { y1: 15, y2: 15, rotate: 0 }
                }
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ transformOrigin: "center" }}
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Mobile dropdown ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
            className="md:hidden overflow-hidden relative z-10"
          >
            <div className="pt-4 pb-2 flex flex-col items-center gap-1">
              {csNavLinks.map((link, i) => {
                const active = pathname === link.href;
                return (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{
                      delay: i * 0.05 + 0.1,
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                  >
                    <Link
                      href={link.href}
                      scroll={false}
                      onClick={() => setMenuOpen(false)}
                      className="relative block px-6 py-2.5 rounded-xl text-center text-lg font-semibold transition-colors duration-200 hover:bg-white/5"
                    >
                      <IridescentText active={active} isDark={isDark}>
                        {link.name}
                      </IridescentText>
                      {active && (
                        <motion.div
                          className="absolute bottom-1 left-1/4 right-1/4 h-[2px] rounded-full overflow-hidden"
                          layoutId="underline-mobile"
                        >
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: isDark
                                ? csUnderlineDark
                                : csUnderlineLight,
                            }}
                          />
                        </motion.div>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
