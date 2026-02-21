"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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

export default function Header() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

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
        <div className="flex items-center space-x-4">
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
          {mounted && (
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <svg
                  className="w-5 h-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l-2.12-2.12a1 1 0 00-1.414 1.414l2.12 2.12a1 1 0 001.414-1.414zM2.05 6.464L4.17 4.343a1 1 0 00-1.414-1.414L.636 5.05a1 1 0 000 1.414l1.414 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-gray-700 dark:text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
