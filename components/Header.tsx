"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { glassStyle } from "./InfoBubble";
import { glassClassNames, FuzzyText } from "./LeftInfoBox";

const navLinks = [
  { name: "About", href: "/about" },
  { name: "Experience", href: "/experience" },
  { name: "Research", href: "/research" },
];

const lightGradient = `linear-gradient(135deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)`;
const darkGradient = `linear-gradient(135deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)`;

const lightGradientActive = `linear-gradient(135deg, rgb(70,85,115) 0%, rgb(95,80,105) 15%, rgb(75,100,120) 30%, rgb(100,85,100) 45%, rgb(70,95,115) 60%, rgb(90,80,110) 75%, rgb(75,90,118) 90%, rgb(98,85,105) 100%)`;
const darkGradientActive = `linear-gradient(135deg, rgb(220,235,255) 0%, rgb(245,230,250) 15%, rgb(220,245,255) 30%, rgb(250,235,245) 45%, rgb(215,240,255) 60%, rgb(240,230,250) 75%, rgb(220,238,255) 90%, rgb(245,230,248) 100%)`;

const underlineGradientLight = `linear-gradient(90deg, rgb(100,115,145), rgb(125,110,135), rgb(105,130,150), rgb(130,115,130), rgb(100,115,145))`;
const underlineGradientDark = `linear-gradient(90deg, rgb(180,200,255), rgb(210,185,230), rgb(180,210,235), rgb(210,185,230), rgb(180,200,255))`;

function IridescentText({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  const light = active ? lightGradientActive : lightGradient;
  const dark = active ? darkGradientActive : darkGradient;
  return (
    <>
      <span
        className="bg-clip-text text-transparent dark:hidden"
        style={{ WebkitBackgroundClip: "text", backgroundImage: light }}
      >
        {children}
      </span>
      <span
        className="bg-clip-text text-transparent hidden dark:inline"
        style={{ WebkitBackgroundClip: "text", backgroundImage: dark }}
      >
        {children}
      </span>
    </>
  );
}

function ThemeToggleButton({
  isDark,
  mounted,
  maskId,
  onToggle,
}: {
  isDark: boolean;
  mounted: boolean;
  maskId: string;
  onToggle: () => void;
}) {
  if (!mounted) return null;
  return (
    <button
      onClick={onToggle}
      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all duration-300"
      aria-label="Toggle dark mode"
    >
      <motion.svg
        viewBox="0 0 24 24"
        className="w-5 h-5 text-current"
        style={{ overflow: "visible" }}
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
              <stop offset="0%" stopColor="rgba(220,225,255,0.95)" />
              <stop offset="25%" stopColor="rgba(245,220,250,0.9)" />
              <stop offset="50%" stopColor="rgba(220,240,255,0.95)" />
              <stop offset="75%" stopColor="rgba(250,225,245,0.9)" />
              <stop offset="100%" stopColor="rgba(225,230,255,0.95)" />
            </linearGradient>
          )}
        </defs>
        <motion.circle
          cx="12"
          cy="12"
          fill={isDark ? `url(#${maskId}-grad)` : "currentColor"}
          mask={`url(#${maskId})`}
          initial={false}
          animate={{ r: isDark ? 5 : 9 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        <motion.g
          stroke={isDark ? "rgba(230,232,255,0.9)" : "currentColor"}
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

export default function Header() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const maskId = useId();
  const maskIdMobile = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
  };

  return (
    <header
      className={`${glassClassNames} relative z-50 p-4 rounded-2xl overflow-hidden mx-2 mt-2`}
      style={{ ...glassStyle }}
    >
      {/* Specular highlight */}
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

      {/* Bottom specular highlight */}
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
        <Link href="/" className="text-2xl font-bold">
          <FuzzyText>
            <IridescentText>My Portfolio</IridescentText>
          </FuzzyText>
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden md:flex items-center space-x-4">
          <ul className="flex items-center space-x-4 font-semibold text-lg">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.name}>
                  <Link href={link.href} className="relative">
                    <FuzzyText>
                      <IridescentText active={isActive}>
                        {link.name}
                      </IridescentText>
                    </FuzzyText>
                    {isActive && (
                      <motion.div
                        className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full overflow-hidden"
                        layoutId="underline"
                      >
                        <div
                          className="absolute inset-0 dark:hidden"
                          style={{ backgroundImage: underlineGradientLight }}
                        />
                        <div
                          className="absolute inset-0 hidden dark:block"
                          style={{ backgroundImage: underlineGradientDark }}
                        />
                      </motion.div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ThemeToggleButton isDark={isDark} mounted={mounted} maskId={maskId} onToggle={toggleDarkMode} />
        </div>

        {/* ── Mobile: theme toggle + hamburger ── */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggleButton isDark={isDark} mounted={mounted} maskId={maskIdMobile} onToggle={toggleDarkMode} />
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-all duration-200"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" className="text-black dark:text-white">
              <motion.line
                x1="3" x2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                animate={menuOpen ? { y1: 10, y2: 10, rotate: 45 } : { y1: 5, y2: 5, rotate: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ transformOrigin: "center" }}
              />
              <motion.line
                x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                animate={{ opacity: menuOpen ? 0 : 1, scaleX: menuOpen ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                style={{ transformOrigin: "center" }}
              />
              <motion.line
                x1="3" x2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                animate={menuOpen ? { y1: 10, y2: 10, rotate: -45 } : { y1: 15, y2: 15, rotate: 0 }}
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
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.05 + 0.1, duration: 0.3, ease: "easeOut" }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="relative block px-6 py-2.5 rounded-xl text-center text-lg font-semibold transition-colors duration-200 hover:bg-white/5"
                    >
                      <FuzzyText>
                        <IridescentText active={isActive}>
                          {link.name}
                        </IridescentText>
                      </FuzzyText>
                      {isActive && (
                        <motion.div
                          className="absolute bottom-1 left-1/4 right-1/4 h-[2px] rounded-full overflow-hidden"
                          layoutId="underline-mobile"
                        >
                          <div
                            className="absolute inset-0 dark:hidden"
                            style={{ backgroundImage: underlineGradientLight }}
                          />
                          <div
                            className="absolute inset-0 hidden dark:block"
                            style={{ backgroundImage: underlineGradientDark }}
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
