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

const lightGradient = `linear-gradient(135deg, rgba(10,10,20,0.85) 0%, rgba(25,15,35,0.8) 15%, rgba(10,20,30,0.83) 30%, rgba(30,15,25,0.78) 45%, rgba(10,20,28,0.82) 60%, rgba(22,12,32,0.8) 75%, rgba(12,18,30,0.83) 90%, rgba(28,15,28,0.8) 100%)`;
const darkGradient = `linear-gradient(135deg, rgba(220,225,255,0.85) 0%, rgba(240,220,250,0.78) 15%, rgba(220,235,255,0.82) 30%, rgba(245,225,240,0.76) 45%, rgba(215,230,250,0.8) 60%, rgba(235,220,248,0.78) 75%, rgba(220,228,252,0.82) 90%, rgba(240,222,245,0.78) 100%)`;

const lightGradientActive = `linear-gradient(135deg, rgba(5,5,15,0.95) 0%, rgba(18,8,28,0.92) 15%, rgba(5,12,22,0.95) 30%, rgba(22,8,18,0.9) 45%, rgba(5,14,22,0.94) 60%, rgba(15,6,25,0.92) 75%, rgba(6,12,24,0.95) 90%, rgba(20,8,22,0.92) 100%)`;
const darkGradientActive = `linear-gradient(135deg, rgba(245,248,255,1) 0%, rgba(255,245,255,0.95) 15%, rgba(245,252,255,0.98) 30%, rgba(255,248,255,0.94) 45%, rgba(240,250,255,0.97) 60%, rgba(255,245,255,0.95) 75%, rgba(245,250,255,0.98) 90%, rgba(255,248,255,0.95) 100%)`;

const underlineGradientLight = `linear-gradient(90deg, rgba(10,10,20,0.9), rgba(25,15,35,0.85), rgba(10,20,30,0.9), rgba(30,15,25,0.85), rgba(10,10,20,0.9))`;
const underlineGradientDark = `linear-gradient(90deg, rgba(245,248,255,0.95), rgba(255,245,255,0.9), rgba(245,252,255,0.95), rgba(255,248,255,0.9), rgba(245,248,255,0.95))`;

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
