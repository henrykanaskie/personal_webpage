"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { glassStyle } from "./InfoBubble";
import { glassClassNames } from "./LeftInfoBox";

// ─── Navigation links ─────────────────────────────────────────────────────────

const csNavLinks = [
  { name: "About", href: "/about" },
  { name: "Experience", href: "/cs/experience" },
  { name: "Projects", href: "/cs/projects" },
  { name: "Education", href: "/cs/education" },
];

const photoNavLinks = [
  { name: "About", href: "/photography/about" },
  { name: "Gallery", href: "/photography" },
  { name: "Portraits", href: "/photography/portraits" },
  { name: "Landscape", href: "/photography/landscape" },
  { name: "Astrophotography", href: "/photography/astrophotography" },
  { name: "Street", href: "/photography/street" },
];

// ─── CS Gradients (cool iridescent) ──────────────────────────────────────────

const csLightGrad = `linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)`;
const csDarkGrad = `linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)`;

const csLightGradActive = `linear-gradient(135deg, rgb(70,85,115) 0%, rgb(95,80,105) 15%, rgb(75,100,120) 30%, rgb(100,85,100) 45%, rgb(70,95,115) 60%, rgb(90,80,110) 75%, rgb(75,90,118) 90%, rgb(98,85,105) 100%)`;
const csDarkGradActive = `linear-gradient(135deg, rgb(220,235,255) 0%, rgb(245,230,250) 15%, rgb(220,245,255) 30%, rgb(250,235,245) 45%, rgb(215,240,255) 60%, rgb(240,230,250) 75%, rgb(220,238,255) 90%, rgb(245,230,248) 100%)`;

const csUnderlineLight = `linear-gradient(90deg, rgb(100,115,145), rgb(125,110,135), rgb(105,130,150), rgb(130,115,130), rgb(100,115,145))`;
const csUnderlineDark = `linear-gradient(90deg, rgb(180,200,255), rgb(210,185,230), rgb(180,210,235), rgb(210,185,230), rgb(180,200,255))`;

// ─── Photography nav: subtle solid colors (light/dark) ────────────────────────

const photoLightColorActive = "rgb(80, 62, 95)"; // darker
const photoDarkColorActive = "rgb(238, 225, 248)"; // brighter
const photoMutedLight = "rgb(120, 95, 135)";
const photoMutedDark = "rgb(165, 145, 195)";

// (underline gradients no longer used for photo side — kept for CS)

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

// Photography palette for toggle (matches PhotoNav)
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

// ─── Photography camera-dial nav ─────────────────────────────────────────────

function PhotoNav({
  isDark,
  mounted,
  maskId,
  maskIdMobile: _maskIdMobile,
  visible,
  toggleDarkMode,
  pathname,
}: {
  isDark: boolean;
  mounted: boolean;
  maskId: string;
  maskIdMobile: string;
  visible: boolean;
  toggleDarkMode: () => void;
  pathname: string | null;
}) {
  const isActive = (href: string) => pathname === href;
  const activeIndex = photoNavLinks.findIndex((l) => isActive(l.href));

  const borderColor = isDark
    ? "rgba(200,185,230,0.25)"
    : "rgba(120,85,145,0.2)";
  const bgColor = isDark ? "rgba(8,6,14,0.7)" : "rgba(252,248,244,0.7)";
  const notchColor = isDark ? "rgba(200,185,230,0.3)" : "rgba(120,85,145,0.25)";
  const labelActiveColor = isDark
    ? photoDarkColorActive
    : photoLightColorActive;
  const mutedColor = isDark ? photoMutedDark : photoMutedLight;
  const indicatorColor = isDark
    ? "rgba(220,210,245,0.9)"
    : "rgba(110,75,140,0.85)";

  return (
    <header
      style={{
        position: "fixed",
        top: "50%",
        right: 20,
        transform: `translateY(-50%) ${visible ? "translateX(0)" : "translateX(120%)"}`,
        zIndex: 60,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.35s ease, transform 0.4s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <nav
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "14px 0",
          borderRadius: 40,
          background: bgColor,
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          border: `1px solid ${borderColor}`,
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 8px 28px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6)",
          width: 44,
        }}
      >
        {/* Top knurl texture */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            marginBottom: 10,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 1,
                background: notchColor,
                borderRadius: 1,
              }}
            />
          ))}
        </div>

        {/* Mode selector indicator — slides to active item */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* Sliding indicator */}
          {activeIndex >= 0 && (
            <motion.div
              layoutId="dial-indicator"
              style={{
                position: "absolute",
                left: -2,
                right: -2,
                height: 36,
                borderRadius: 20,
                background: isDark
                  ? "rgba(200,185,230,0.1)"
                  : "rgba(120,85,145,0.08)",
                border: `1px solid ${indicatorColor}`,
                boxShadow: isDark
                  ? "0 0 12px rgba(200,185,230,0.15)"
                  : "0 0 8px rgba(120,85,145,0.1)",
              }}
              initial={false}
              animate={{ top: activeIndex * 38 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}

          {/* Nav items */}
          {photoNavLinks.map((link, _i) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                scroll={false}
                onClick={() => {
                  sessionStorage.setItem("lastBranch", "photo");
                }}
                style={{
                  position: "relative",
                  zIndex: 1,
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 36,
                  borderRadius: 20,
                  transition: "opacity 0.2s ease",
                }}
                title={link.name}
              >
                {/* Notch mark */}
                <div
                  style={{
                    width: active ? 14 : 8,
                    height: 2,
                    borderRadius: 2,
                    background: active ? indicatorColor : notchColor,
                    marginBottom: 3,
                    transition: "width 0.25s ease, background 0.25s ease",
                  }}
                />
                {/* Abbreviated label */}
                <span
                  style={{
                    fontSize: "6px",
                    letterSpacing: "0.18em",
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                    color: active ? labelActiveColor : mutedColor,
                    fontWeight: active ? 600 : 400,
                    transition: "color 0.2s ease",
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                  }}
                >
                  {link.name.length > 5
                    ? link.name.slice(0, 4).toUpperCase()
                    : link.name.toUpperCase()}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom knurl texture */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            marginTop: 10,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 1,
                background: notchColor,
                borderRadius: 1,
              }}
            />
          ))}
        </div>

        {/* Theme toggle at bottom */}
        <div style={{ marginTop: 12 }}>
          <ThemeToggleButton
            isDark={isDark}
            mounted={mounted}
            maskId={maskId}
            onToggle={toggleDarkMode}
            photoMode
          />
        </div>
      </nav>
    </header>
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

  // ── Photography side: completely different nav ──
  if (isPhotoSide) {
    return (
      <PhotoNav
        isDark={isDark}
        mounted={mounted}
        maskId={maskId}
        maskIdMobile={maskIdMobile}
        visible={visible}
        toggleDarkMode={toggleDarkMode}
        pathname={pathname}
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
        {/* Logo — always links home */}
        <Link href="/" scroll={false} className="text-2xl font-bold">
          <IridescentText isDark={isDark}>My Portfolio</IridescentText>
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
