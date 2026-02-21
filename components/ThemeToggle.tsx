"use client";

import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const maskId = useId();

  useEffect(() => {
    setMounted(true);

    // Always follow system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const isDarkMode = mediaQuery.matches;

    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Listen for system preference changes
    const handleChange = (e: MediaQueryListEvent) => {
      const newDarkMode = e.matches;
      setIsDark(newDarkMode);
      if (newDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const newDarkMode = !isDark;

    setIsDark(newDarkMode);

    if (newDarkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleDarkMode}
      className="fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
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
              animate={{
                cx: isDark ? 32 : 18,
                cy: isDark ? -2 : 5,
              }}
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
